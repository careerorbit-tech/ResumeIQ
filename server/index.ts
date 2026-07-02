import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

export { app, httpServer };

// Remove X-Powered-By header
app.disable("x-powered-by");

// Security headers — strict but functional
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
  })
);

// General API rate limit — 60 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);

// AI endpoint rate limit — 10 AI calls per minute per IP
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
        const snippet = JSON.stringify(capturedJsonResponse).slice(0, 100);
        logLine += ` :: ${snippet}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Vite dev server or production static files — AFTER routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Global error handler — MUST be AFTER all routes and middleware
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const errObj = err as { status?: number; statusCode?: number; message?: string };
    const status = errObj.status || errObj.statusCode || 500;
    const message = errObj.message || "Internal Server Error";

    console.error("[Server] Unhandled error:", err);

    if (res.headersSent) return;

    // Hide error details in production
    const safeMessage = process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again."
      : message;

    res.status(status).json({
      success: false,
      message: safeMessage,
      code: "INTERNAL_ERROR",
    });
  });

  // Only start a listening server when NOT running on Vercel
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    const port = parseInt(process.env.PORT || "5003", 10);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  }
})().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string) {
  log(`Received ${signal}. Shutting down gracefully...`);
  httpServer.close(() => {
    log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
