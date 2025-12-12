import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // 加载根目录和当前目录的 .env 文件
  const rootEnv = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const localEnv = loadEnv(mode, process.cwd(), "");
  // 优先使用 VITE_BACKEND_PORT，其次使用 PORT，默认 3000
  const backendPort = localEnv.VITE_BACKEND_PORT || rootEnv.PORT || "3000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2020",
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          // SSE 长连接超时设置
          timeout: 0, // 禁用超时
          proxyTimeout: 0, // 禁用代理超时
          // 支持 SSE 流式传输
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              // 对于 SSE 请求，设置正确的请求头
              // 注意：req.url 是原始 URL（带 /api 前缀）
              if (req.url?.includes("/api/streams/") || req.url === "/api/agent") {
                proxyReq.setHeader("Accept", "text/event-stream");
                proxyReq.setHeader("Cache-Control", "no-cache");
                console.log("[vite proxy] SSE request:", req.url);
              }
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              // 确保 SSE 响应的 Content-Type 正确
              // 注意：req.url 是原始 URL（带 /api 前缀）
              if (req.url?.includes("/api/streams/") || req.url === "/api/agent") {
                // 强制设置正确的响应头
                proxyRes.headers["content-type"] = "text/event-stream; charset=utf-8";
                proxyRes.headers["cache-control"] = "no-cache";
                proxyRes.headers["connection"] = "keep-alive";
                proxyRes.headers["x-accel-buffering"] = "no"; // 禁用 Nginx 缓冲（如果使用）
                console.log("[vite proxy] SSE response headers set for:", req.url);

                // 监听后端连接关闭，立即关闭前端连接
                proxyRes.on("close", () => {
                  console.log("[vite proxy] Backend closed SSE connection:", req.url);
                  res.end();
                });
              }
            });
            // 监听代理错误（后端断开时触发）
            proxy.on("error", (err, req, res) => {
              console.error("[vite proxy] Proxy error:", err.message);
              if (req.url?.includes("/api/streams/") || req.url === "/api/agent") {
                // 对于 SSE 连接，确保客户端收到断开信号
                if (res && !res.headersSent) {
                  res.writeHead(502, { "Content-Type": "text/plain" });
                }
                if (res && typeof res.end === "function") {
                  res.end("Backend disconnected");
                }
              }
            });
          },
          // 禁用缓冲以支持流式传输
          ws: false,
        },
      },
    },
  };
});

