import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist", import.meta.url));
const safeRoot = normalize(root.endsWith(sep) ? root : `${root}${sep}`);
const port = Number(process.env.PORT ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

if (!existsSync(root)) {
  console.error("Missing dist folder. Run `npm run build` first.");
  process.exit(1);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const requested = decodeURIComponent(url.pathname);
    const relativePath = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
    let filePath = normalize(join(root, relativePath));

    if (!filePath.startsWith(safeRoot)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(root, "index.html");

    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Preview server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Laffy preview: http://127.0.0.1:${port}`);
});
