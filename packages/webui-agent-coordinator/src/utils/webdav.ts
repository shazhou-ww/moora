/**
 * WebDAV API 工具函数
 */

const WEBDAV_BASE_URL = "/api/webdav";

/**
 * 文件/目录信息
 */
export type FileItem = {
  /**
   * 名称
   */
  name: string;
  /**
   * 路径（相对于 workspace 根目录）
   */
  path: string;
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

/**
 * 解析 PROPFIND 响应的 XML
 *
 * @param xmlText - XML 文本
 * @returns 文件/目录信息列表
 */
function parsePropFindResponse(xmlText: string): FileItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  // 检查是否有解析错误
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`Failed to parse XML: ${parserError.textContent}`);
  }

  const responses = doc.querySelectorAll("response");
  const items: FileItem[] = [];

  responses.forEach((response) => {
    const hrefElement = response.querySelector("href");
    const displayNameElement = response.querySelector("displayname");
    const lastModifiedElement = response.querySelector("getlastmodified");
    const contentLengthElement = response.querySelector("getcontentlength");
    const resourceTypeElement = response.querySelector("resourcetype");

    if (!hrefElement || !displayNameElement) {
      return;
    }

    const href = hrefElement.textContent || "";
    const name = displayNameElement.textContent || "";
    const isCollection = resourceTypeElement?.querySelector("collection") !== null;
    const size = contentLengthElement ? parseInt(contentLengthElement.textContent || "0", 10) : 0;
    const lastModified = lastModifiedElement
      ? new Date(lastModifiedElement.textContent || "")
      : new Date();

    // 从 href 中提取相对路径
    let path = href;
    if (path.startsWith("/webdav/")) {
      path = path.replace("/webdav", "");
    }
    if (path.startsWith("/")) {
      path = path.slice(1);
    }
    // 移除尾部的斜杠（对于目录）
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }

    items.push({
      name,
      path,
      isDirectory: isCollection,
      size,
      lastModified,
    });
  });

  return items;
}

/**
 * 编码路径用于 URL
 *
 * @param path - 路径
 * @returns 编码后的路径
 */
function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * 列出目录内容
 *
 * @param path - 目录路径（相对于 workspace 根目录，空字符串表示根目录）
 * @returns 文件/目录信息列表
 */
export async function listDirectory(path: string = ""): Promise<FileItem[]> {
  const url = path ? `${WEBDAV_BASE_URL}/${encodePath(path)}` : WEBDAV_BASE_URL;

  const response = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Depth: "1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list directory: ${response.statusText}`);
  }

      const xmlText = await response.text();
      const items = parsePropFindResponse(xmlText);

  // 过滤掉当前目录本身，只返回子项
  return items.filter((item) => item.path !== path || item.name !== "");
}

/**
 * 读取文件内容
 *
 * @param path - 文件路径（相对于 workspace 根目录）
 * @returns 文件内容（Blob）
 */
export async function readFile(path: string): Promise<Blob> {
  const url = `${WEBDAV_BASE_URL}/${encodePath(path)}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * 读取文本文件内容
 *
 * @param path - 文件路径（相对于 workspace 根目录）
 * @returns 文本内容
 */
export async function readTextFile(path: string): Promise<string> {
  const blob = await readFile(path);
  return blob.text();
}

/**
 * 获取文件扩展名
 *
 * @param filename - 文件名
 * @returns 扩展名（小写，不包含点）
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) {
    return "";
  }
  return parts[parts.length - 1].toLowerCase();
}

/**
 * 判断是否为图片文件
 *
 * @param filename - 文件名
 * @returns 是否是图片
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
}

/**
 * 判断是否为 Markdown 文件
 *
 * @param filename - 文件名
 * @returns 是否是 Markdown
 */
export function isMarkdownFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["md", "markdown"].includes(ext);
}

/**
 * 判断是否为文本文件
 *
 * @param filename - 文件名
 * @returns 是否是文本文件
 */
export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return [
    "txt",
    "md",
    "markdown",
    "json",
    "yaml",
    "yml",
    "xml",
    "html",
    "css",
    "js",
    "ts",
    "tsx",
    "jsx",
    "vue",
    "py",
    "java",
    "cpp",
    "c",
    "h",
    "hpp",
    "go",
    "rs",
    "rb",
    "php",
    "swift",
    "kt",
    "scala",
    "sh",
    "bash",
    "zsh",
    "fish",
    "ps1",
    "bat",
    "cmd",
    "log",
    "conf",
    "config",
    "ini",
    "toml",
    "sql",
    "graphql",
    "diff",
    "patch",
  ].includes(ext);
}

/**
 * 根据文件扩展名获取代码语言（用于语法高亮）
 *
 * @param filename - 文件名
 * @returns 语言标识符
 */
export function getCodeLanguage(filename: string): string {
  const ext = getFileExtension(filename);
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    bat: "batch",
    cmd: "batch",
    sql: "sql",
    html: "html",
    css: "css",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    md: "markdown",
    markdown: "markdown",
    vue: "vue",
    graphql: "graphql",
  };
  return languageMap[ext] || "text";
}
