import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { registerRoutes } from "../server/routes.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ── Diagnostic Routes ────────────────────────────────────────────────────────
// This route runs even if the rest of the app fails to initialize
app.get("/api/ping", (_req, res) => {
  res.json({
    pong: true,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasApiKey: !!process.env.GROQ_API_KEY
  });
});

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    console.log(`${new Date().toISOString()} [API] ${req.method} ${req.path}`);
  }
  next();
};

app.use(requestLogger);

// Sync setup state
let isSetup = false;
let setupError: any = null;

async function performSetup() {
  if (isSetup) return;
  try {
    // Security headers (moved inside setup to avoid top-level crash)
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })
    );

    // Rate limiting (moved inside setup)
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      message: { error: "Too many requests, please try again in a minute." },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use("/api", limiter);

    console.log("Initializing server routes...");
    await registerRoutes(httpServer, app);

    // Final global error handler for the app
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Express App Error:", err);
      const status = err.status || err.statusCode || 500;
      res.status(status).json({
        error: err.message || "Internal Server Error",
        code: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    });

    isSetup = true;
    console.log("Server initialization successful.");
  } catch (err: any) {
    console.error("CRITICAL: Server initialization failed:", err);
    setupError = {
      message: err.message,
      stack: err.stack,
      name: err.name
    };
    throw err;
  }
}

// Vercel Serverless Function Config (disables body parsing so multer works)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Set maximum duration for Vercel Serverless Function to prevent timeouts during Groq API calls
export const maxDuration = 60;

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // Allow /api/ping to bypass setup to confirm the function is alive
  if (req.url === "/api/ping") {
    return app(req, res);
  }

  try {
    if (!isSetup && !setupError) {
      await performSetup();
    }

    // Check if recovery is possible or return the cached error
    if (setupError) {
      return res.status(500).json({
        error: "Server failed to initialize.",
        details: setupError.message,
        stack: setupError.stack,
        code: "SETUP_FAILED"
      });
    }

    // Hand off to the express app body
    // We return a Promise that resolves when Express finishes writing to the response
    return new Promise((resolve, reject) => {
      // Monkey-patch res.end to auto-resolve the handler
      const originalEnd = res.end;
      res.end = function (...args: any[]) {
        resolve(undefined);
        return originalEnd.apply(this, args);
      };
      app(req, res);
    });
  } catch (error: any) {
    console.error("Vercel Handler Crash:", error);
    res.status(500).json({
      error: "A critical server error occurred during request handling.",
      details: error.message,
      stack: error.stack,
      code: "HANDLER_ERROR"
    });
  }
}
