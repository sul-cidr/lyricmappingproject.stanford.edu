// A static file server for the browser smoke test, on node:http so it adds no
// dependency of its own. It serves the repository exactly as GitHub Pages does:
// plain files, no rewriting, no build.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** @type {Record<string, string>} */
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

/**
 * Serves the repository root on an ephemeral port.
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
export async function serveSite() {
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const relative = normalize(path === "/" ? "index.html" : path.slice(1));
    if (relative.startsWith("..")) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(join(siteRoot, relative));
      response.writeHead(200, { "content-type": CONTENT_TYPES[extname(relative)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("server did not bind a port");

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise(resolve => server.close(() => resolve(undefined)))
  };
}
