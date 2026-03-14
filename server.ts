import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import archiver from "archiver";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Fix for Firebase Auth Popup closing immediately on some browsers/hosts
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });

  // Health check for Render/Cloud Run
  app.get("/healthz", (req, res) => res.status(200).send("OK"));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Project Export Endpoint (Emergency Sync Alternative)
  app.get("/api/export-project", (req, res) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('sunny-signals-project.zip');

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      res.status(500).send({ error: err.message });
    });
    
    archive.pipe(res);

    // Add files but ignore bulky/hidden ones
    // Added 'dot: true' to ensure .env.example and other config files are included
    archive.glob('**/*', {
      cwd: process.cwd(),
      dot: true,
      ignore: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        '*.zip',
        '.next/**',
        'build/**',
        '.env' // Never export the actual .env with secrets
      ]
    });

    archive.finalize();
  });

  // Logging middleware
  app.use((req, res, next) => {
    if (req.url !== "/healthz") {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // Determine if we are in production mode
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const distPath = path.join(__dirname, "dist");

  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode...");
    // Dynamic import to avoid loading Vite in production (saves RAM)
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in PRODUCTION mode. Serving from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
