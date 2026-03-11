const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = 4000;
const DIST = path.join(__dirname, "dist");

// Extract zip if dist folder doesn't exist
if (!fs.existsSync(DIST)) {
  console.log("Extracting dist.zip...");
  const { execSync } = require("child_process");
  const zipPath = path.join(__dirname, "dist.zip");
  try {
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${DIST}' -Force"`,
      { stdio: "inherit" }
    );
    console.log("Extracted successfully.");
  } catch (e) {
    console.error("Failed to extract zip:", e.message);
    process.exit(1);
  }
}

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const server = http.createServer((req, res) => {
  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";

  const filePath = path.join(DIST, url);

  // Prevent directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";

    // Check if client accepts gzip
    const acceptEncoding = req.headers["accept-encoding"] || "";
    if (acceptEncoding.includes("gzip")) {
      zlib.gzip(data, (err, compressed) => {
        if (err) {
          res.writeHead(200, { "Content-Type": mime, "Access-Control-Allow-Origin": "*" });
          res.end(data);
        } else {
          res.writeHead(200, {
            "Content-Type": mime,
            "Content-Encoding": "gzip",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(compressed);
        }
      });
    } else {
      res.writeHead(200, { "Content-Type": mime, "Access-Control-Allow-Origin": "*" });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  Adventure Land running at http://localhost:${PORT}\n`);
  console.log("  Serving with gzip compression (~8MB transfer)");
  console.log("  Press Ctrl+C to stop\n");
});
