/**
 * WebDAV handler
 *
 * 为 workspace 内容提供 WebDAV 接口
 * 实现轻量级 WebDAV 服务器，支持基本的文件操作
 */

import { Buffer } from "node:buffer";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, normalize, relative, resolve, join } from "node:path";

import { getLogger } from "@/logger";

const logger = getLogger();

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 创建 WebDAV handler 的选项
 */
export type CreateWebDAVHandlerOptions = {
  /**
   * Workspace 根目录路径
   */
  workspacePath: string;
};

/**
 * 文件/目录信息
 */
type FileInfo = {
  /**
   * 名称
   */
  name: string;
  /**
   * 是否是目录
   */
  isDirectory: boolean;
  /**
   * 大小（字节）
   */
  size: number;
  /**
   * 修改时间
   */
  lastModified: Date;
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 验证路径是否在 workspace 内
 *
 * @param workspaceRoot - Workspace 根目录
 * @param relativePath - 相对路径
 * @returns 如果路径安全，返回规范化后的绝对路径；否则返回 null
 */
function validatePath(workspaceRoot: string, relativePath: string): string | null {
  // 规范化路径，移除 ".." 和 "." 等
  const normalized = normalize(relativePath);

  // 解析为绝对路径
  const absolutePath = resolve(workspaceRoot, normalized);

  // 规范化 workspace 根目录
  const rootNormalized = normalize(resolve(workspaceRoot));

  // 使用 relative 检查路径是否在 workspace 内
  // 如果路径在 workspace 外，relative 会返回包含 ".." 的路径
  const relativeToRoot = relative(rootNormalized, absolutePath);
  if (relativeToRoot.startsWith("..") || relativeToRoot === "..") {
    return null;
  }

  return absolutePath;
}

/**
 * 获取文件信息
 *
 * @param filePath - 文件路径
 * @param baseName - 基础名称
 * @returns 文件信息
 */
function getFileInfo(filePath: string, baseName: string): FileInfo | null {
  try {
    const stat = statSync(filePath);
    return {
      name: baseName,
      isDirectory: stat.isDirectory(),
      size: stat.size,
      lastModified: stat.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * 生成 PROPFIND 响应 XML
 *
 * @param files - 文件信息列表
 * @param basePath - 基础路径
 * @returns XML 字符串
 */
function generatePropFindResponse(files: FileInfo[], basePath: string): string {
  const responses = files.map((file) => {
    const href = join(basePath, file.name).replace(/\\/g, "/");
    const lastModified = file.lastModified.toUTCString();
    const contentLength = file.isDirectory ? "" : `<d:getcontentlength>${file.size}</d:getcontentlength>`;

    return `
    <d:response>
      <d:href>${href}</d:href>
      <d:propstat>
        <d:prop>
          <d:displayname>${file.name}</d:displayname>
          <d:getlastmodified>${lastModified}</d:getlastmodified>
          <d:resourcetype>${file.isDirectory ? "<d:collection/>" : ""}</d:resourcetype>
          ${contentLength}
        </d:prop>
        <d:status>HTTP/1.1 200 OK</d:status>
      </d:propstat>
    </d:response>`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  ${responses.join("")}
</d:multistatus>`;
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建 WebDAV handler
 *
 * 为 workspace 目录提供 WebDAV 访问接口
 * 支持的方法：
 * - GET: 读取文件
 * - PUT: 写入文件
 * - DELETE: 删除文件/目录
 * - PROPFIND: 列出目录内容/获取文件属性
 * - MKCOL: 创建目录
 *
 * @param options - 配置选项
 * @returns WebDAV handler 函数
 */
export function createWebDAVHandler(options: CreateWebDAVHandlerOptions) {
  const { workspacePath } = options;
  const absoluteWorkspacePath = resolve(workspacePath);

  logger.server.info("[WebDAV] Initializing WebDAV handler", {
    workspacePath: absoluteWorkspacePath,
  });

  /**
   * WebDAV handler 函数
   *
   * 处理所有 WebDAV 请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ request, set, path }: any) => {
    const method = request.method;
    // URL 是 Web Standard API，在 Bun 中全局可用
    const url = new globalThis.URL(request.url);
    const requestPath = url.pathname.replace(/^\/webdav/, ""); // 移除 /webdav 前缀

    logger.server.debug("[WebDAV] Request", {
      method,
      path: requestPath,
    });

    try {
      // 验证路径
      const safePath = validatePath(absoluteWorkspacePath, requestPath || "/");
      if (!safePath) {
        logger.server.warn("[WebDAV] Invalid path", { requestPath });
        set.status = 403;
        return "Forbidden: Path outside workspace";
      }

      // 根据方法处理请求
      switch (method) {
        case "GET": {
          // 读取文件
          if (!existsSync(safePath)) {
            set.status = 404;
            return "Not Found";
          }

          const stat = statSync(safePath);
          if (stat.isDirectory()) {
            set.status = 400;
            return "Bad Request: Cannot GET directory";
          }

          const content = readFileSync(safePath);
          // Response 是 Web Standard API，在 Bun 中全局可用
          return new globalThis.Response(content, {
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": stat.size.toString(),
              "Last-Modified": stat.mtime.toUTCString(),
            },
          });
        }

        case "PUT": {
          // 写入文件
          const dir = dirname(safePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          const body = await request.arrayBuffer();
          writeFileSync(safePath, Buffer.from(body));

          set.status = 201;
          return "Created";
        }

        case "DELETE": {
          // 删除文件/目录
          if (!existsSync(safePath)) {
            set.status = 404;
            return "Not Found";
          }

          const stat = statSync(safePath);
          if (stat.isDirectory()) {
            rmSync(safePath, { recursive: true });
          } else {
            rmSync(safePath);
          }

          set.status = 204;
          return "";
        }

        case "PROPFIND": {
          // 列出目录内容或获取文件属性
          if (!existsSync(safePath)) {
            set.status = 404;
            return "Not Found";
          }

          const stat = statSync(safePath);
          const files: FileInfo[] = [];

          if (stat.isDirectory()) {
            // 列出目录内容
            const entries = readdirSync(safePath);
            for (const entry of entries) {
              const entryPath = join(safePath, entry);
              const info = getFileInfo(entryPath, entry);
              if (info) {
                files.push(info);
              }
            }
          } else {
            // 返回文件信息
            const info = getFileInfo(safePath, path.split("/").pop() || "");
            if (info) {
              files.push(info);
            }
          }

          const xml = generatePropFindResponse(files, requestPath || "/");
          if (!set.headers) {
            set.headers = {};
          }
          set.headers["Content-Type"] = "application/xml; charset=utf-8";
          set.status = 207; // Multi-Status
          return xml;
        }

        case "MKCOL": {
          // 创建目录
          if (existsSync(safePath)) {
            set.status = 405;
            return "Method Not Allowed: Directory already exists";
          }

          const dir = dirname(safePath);
          if (!existsSync(dir)) {
            set.status = 409;
            return "Conflict: Parent directory does not exist";
          }

          mkdirSync(safePath);
          set.status = 201;
          return "Created";
        }

        case "OPTIONS": {
          // 返回支持的 WebDAV 方法
          if (!set.headers) {
            set.headers = {};
          }
          set.headers["DAV"] = "1, 2";
          set.headers["Allow"] = "GET, PUT, DELETE, PROPFIND, MKCOL, OPTIONS";
          set.status = 200;
          return "";
        }

        default: {
          set.status = 405;
          return "Method Not Allowed";
        }
      }
    } catch (error) {
      logger.server.error("[WebDAV] Error handling request", { error, method, path: requestPath });
      set.status = 500;
      return "Internal Server Error";
    }
  };
}