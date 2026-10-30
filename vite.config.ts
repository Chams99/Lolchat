/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Runs the handlers in api/ during `npm run dev`, the way Vercel runs them in production.
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const route = url.pathname.match(/^\/api\/([a-z-]+)$/)?.[1];
        if (!route) return next();
        try {
          const handlers = await server.ssrLoadModule(`/api/${route}.ts`);
          const handler = handlers[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            res.end();
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const request = new Request(url, {
            method: req.method,
            headers: { "content-type": req.headers["content-type"] ?? "" },
            body: hasBody ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          if (response.body) {
            const reader = response.body.getReader();
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make OPENROUTER_API_KEY and OPENROUTER_MODEL from .env available to the local handlers.
  Object.assign(process.env, loadEnv(mode, process.cwd(), "OPENROUTER_"));
  return {
    plugins: [react(), localApi()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
