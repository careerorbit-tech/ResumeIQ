import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";
// @ts-ignore
import helmet from "helmet";
// @ts-ignore
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

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
    console.log("Initializing server routes...");
    await registerRoutes(httpServer, app);

    // Final global error handler for the app
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Express App Error:", err);
      const status = err.status || err.statusCode || 500;
      res.status(status).json({
        error: err.message || "Internal Server Error",
        code: "SERVER_ERROR"
      });
    });

    isSetup = true;
    console.log("Server initialization successful.");
  } catch (err: any) {
    console.error("CRITICAL: Server initialization failed:", err);
    setupError = err;
    throw err;
  }
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  try {
    if (!isSetup) {
      await performSetup();
    }

    // Check if a previous setup attempt failed
    if (setupError) {
      return res.status(500).json({
        error: "Server failed to initialize.",
        details: setupError.message,
        code: "SETUP_FAILED"
      });
    }

    // Hand off to the express app body
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Handler Crash:", error);
    res.status(500).json({
      error: "A critical server error occurred during request handling.",
      details: error.message,
      code: "HANDLER_ERROR"
    });
  }
}
