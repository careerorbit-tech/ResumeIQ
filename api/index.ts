import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { registerRoutes } from "../server/routes.js";

const app = express();
const httpServer = createServer(app);

// Initialization state — cached across warm Vercel invocations
let isSetup = false;
let setupError: { message: string; name: string } | null = null;
let setupPromise: Promise<void> | null = null;

async function performSetup(): Promise<void> {
  if (isSetup) return;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      console.log("[Setup] Initializing serverless handler...");

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

      // General rate limit — 60 req/min (infrastructure protection)
      const generalLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        message: {
          success: false,
          message: "Too many requests, please try again in a minute.",
          code: "RATE_LIMITED",
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use("/api", generalLimiter);

      // AI endpoint rate limit — 10 req/min (cost protection, not a user limit)
      const aiLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: {
          success: false,
          message: "Too many AI requests. Please wait a moment before trying again.",
          code: "RATE_LIMITED",
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use("/api/analyze", aiLimiter);
      app.use("/api/rewrite", aiLimiter);

      await registerRoutes(httpServer, app);

      // Global error handler — always returns JSON
      app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        const errObj = err as { status?: number; statusCode?: number; message?: string };
        const status = errObj.status || errObj.statusCode || 500;
        const message = errObj.message || "Internal Server Error";

        console.error("[App Error]", message);

        if (!res.headersSent) {
          res.status(status).json({
            success: false,
            message,
            code: "SERVER_ERROR",
          });
        }
      });

      isSetup = true;
      console.log("[Setup] Serverless handler ready.");
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      console.error("[Setup] CRITICAL: Initialization failed:", errObj.message);
      setupError = { message: errObj.message, name: errObj.name };
      isSetup = false;
      setupPromise = null; // Allow retry on next request
      throw errObj;
    }
  })();

  return setupPromise;
}

// Vercel Serverless Function config — disable built-in body parser
// so multer can handle multipart/form-data correctly
export const config = {
  api: {
    bodyParser: false,
  },
};

// Vercel Serverless Function Handler
export default async function handler(req: Request, res: Response) {
  const startTime = Date.now();
  console.log(
    `[Handler] ${req.method} ${req.url} — GROQ_KEY: ${!!process.env.GROQ_API_KEY}`
  );

  try {
    await performSetup();

    if (setupError) {
      console.error("[Handler] Cached setup error:", setupError.message);
      return res.status(500).json({
        success: false,
        message: "Server failed to initialize. Please try again.",
        code: "SETUP_FAILED",
      });
    }

    return new Promise<void>((resolve) => {
      const cleanup = () => {
        console.log(`[Handler] Request finished in ${Date.now() - startTime}ms`);
        resolve();
      };
      res.on("finish", cleanup);
      res.on("close", cleanup);
      res.on("error", (err: Error) => {
        console.error("[Handler] Response error:", err.message);
        cleanup();
      });

      app(req, res, (err?: unknown) => {
        if (err) {
          console.error("[Handler] Express error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "An internal server error occurred.",
              code: "HANDLER_ERROR",
            });
          }
        }
        cleanup();
      });
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "A critical server error occurred.";
    console.error("[Handler] Fatal crash:", message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message,
        code: "HANDLER_ERROR",
      });
    }
  }
}
