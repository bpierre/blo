import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const routes = new Map<string, readonly [URL, string]>([
  ["/", [new URL("index.html", import.meta.url), "text/html"]],
  ["/app.js", [new URL("dist/app.js", import.meta.url), "text/javascript"]],
  ["/style.css", [new URL("style.css", import.meta.url), "text/css"]],
  ["/libraries.js", [
    new URL("dist/libraries.js", import.meta.url),
    "text/javascript",
  ]],
  ...["fixtures.js", "measure.js"].map((file) =>
    [
      `/wasm/${file}`,
      [new URL(`dist/wasm/${file}`, import.meta.url), "text/javascript"],
    ] as const
  ),
  ...["wasm", "wasm/adapter", "wasm/bytes", "index", "image", "svg", "random"].map((
    name,
  ) =>
    [
      `/package/${name}.js`,
      [new URL(`../../dist/esm/${name}.js`, import.meta.url), "text/javascript"],
    ] as const
  ),
]);

const port = Number(process.env.BLO_BENCH_PORT ?? 5174);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("Invalid BLO_BENCH_PORT");
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  // Serve only the explicit public assets above, never arbitrary repo files.
  const path = new URL(request.url ?? "/", "http://localhost").pathname;
  const route = routes.get(path);
  if (!route) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const [file, type] = route;
    const bytes = await readFile(file);
    response.writeHead(200, {
      "Content-Type": `${type}; charset=utf-8`,
      "Content-Length": bytes.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(500).end(
      "Asset missing. Run pnpm run bench:browser to rebuild and restart the server.",
    );
  }
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is busy. Set BLO_BENCH_PORT to another port.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(
  port,
  "127.0.0.1",
  () => console.log(`Blo browser benchmark: http://127.0.0.1:${port}`),
);
