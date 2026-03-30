import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { registerRoutes } from "../server/routes.js";

const app = express();
const httpServer = createServer(app);

// Initialization state
let isSetup = false;
let setupError: any = null;
let setupPromise: Promise<void> | null = null;

async function performSetup() {
  if (isSetup) return;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      console.log("[Setup] Starting server initialization...");

      app.set("trust proxy", 1);
      app.use(express.json({ limit: "10mb" }));
      app.use(express.urlencoded({ extended: false, limit: "10mb" }));

      // Security headers
      app.use(
        helmet({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
        })
      );

      // Rate limiting
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        message: { error: "Too many requests, please try again in a minute." },
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use("/api", limiter);

      console.log("[Setup] Registering routes...");
      await registerRoutes(httpServer, app);

      // Final global error handler for the app
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error("[App Error]", err);
        const status = err.status || err.statusCode || 500;
        if (!res.headersSent) {
          res.status(status).json({
            error: err.message || "Internal Server Error",
            code: "SERVER_ERROR",
            details: process.env.NODE_ENV === "development" ? err.stack : undefined
          });
        }
      });

      isSetup = true;
      console.log("[Setup] Server initialization successful.");
    } catch (err: any) {
      console.error("[Setup] CRITICAL: Server initialization failed:", err);
      setupError = {
        message: err.message,
        stack: err.stack,
        name: err.name
      };
      isSetup = false;
      setupPromise = null; // Allow retry on next request
      throw err;
    }
  })();

  return setupPromise;
}

// Vercel Serverless Function Config
export const config = {
  api: {
    bodyParser: false,
  },
};

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  console.log(`[Handler] ${req.method} ${req.url} - API KEY EXISTS: ${!!process.env.GROQ_API_KEY}`);

  try {
    // Ensure setup is complete
    await performSetup();

    // Check if initialization failed
    if (setupError) {
      console.error("[Handler] Setup error cached:", setupError.message);
      return res.status(500).json({
        error: "Server failed to initialize.",
        details: setupError.message,
        code: "SETUP_FAILED"
      });
    }

    // Hand off to the express app
    // We return a Promise that resolves when the response is finished
    return new Promise((resolve) => {
      const cleanup = () => {
        const duration = Date.now() - startTime;
        console.log(`[Handler] Request finished in ${duration}ms`);
        resolve(undefined);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);
      res.on('error', (err: any) => {
        console.error("[Handler] Response error:", err);
        cleanup();
      });

      // Pass the request to the Express app
      app(req, res);
    });
  } catch (error: any) {
    console.error("[Handler] Fatal Crash:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "A critical server error occurred.",
        details: error.message,
        code: "HANDLER_ERROR"
      });
    }
  }
}
