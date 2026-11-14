import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = process.cwd();
const server = await createServer({
  configFile: resolve(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { App } = await server.ssrLoadModule("/src/App.tsx");
  const htmlPath = resolve(root, "dist/index.html");
  const html = await readFile(htmlPath, "utf8");
  if (!html.includes("<div id=\"root\"><!--app-html--></div>")) {
    throw new Error("Could not find the #root prerender placeholder in dist/index.html");
  }
  const markup = renderToString(createElement(App));
  await writeFile(htmlPath, html.replace("<div id=\"root\"><!--app-html--></div>", `<div id="root">${markup}</div>`));
} finally {
  await server.close();
}
