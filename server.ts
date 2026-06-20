import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable gzip compression for faster asset delivery and extremely responsive loading
  app.use(compression());
  app.use(express.json());

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    // This is where you would integrate Stripe or other payment gateways
    // For now, let's simulate a success URL for the "Free" experience
    // In a real app, you'd use your STRIPE_SECRET_KEY here
    
    try {
      // Mocking a response for demonstration
      res.json({ url: "/dashboard?payment=success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
