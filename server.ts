import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

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

  // Image Proxy to bypass CORS
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("URL is required");
    }

    try {
      console.log(`Proxying image: ${imageUrl}`);
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": new URL(imageUrl).origin,
        },
      });

      const contentType = response.headers["content-type"];
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      // Cache for 1 hour
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(response.data);
    } catch (error: any) {
      console.error(`Proxy error for ${imageUrl}:`, error.message);
      // Return a more descriptive error if possible
      const status = error.response?.status || 500;
      res.status(status).send(`Failed to fetch image: ${error.message}`);
    }
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
    console.log(`Server is listening on port ${PORT} (0.0.0.0)`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
