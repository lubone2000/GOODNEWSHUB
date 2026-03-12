import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Webhook Proxy - Keeps logic server-side and avoids CORS issues
  app.post("/api/webhooks/push", async (req, res) => {
    const { url, payload } = req.body;
    
    if (!url || !payload) {
      return res.status(400).json({ error: "Missing url or payload" });
    }

    try {
      console.log(`Firing webhook to: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      res.json({ 
        success: response.ok, 
        status: response.status,
        message: response.ok ? "Webhook fired successfully" : "Webhook failed"
      });
    } catch (error) {
      console.error("Webhook Proxy Error:", error);
      res.status(500).json({ error: "Failed to fire webhook via proxy" });
    }
  });

  // Determine if we are in production mode
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const distPath = path.join(__dirname, "dist");

  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in PRODUCTION mode. Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
