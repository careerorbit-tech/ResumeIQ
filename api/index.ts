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

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Sync setup placeholder
let isSetup = false;
let setupError: any = null;
const setupPromise = (async () => {
  try {
    await registerRoutes(httpServer, app);

    // Final error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      res.status(status).json({
        error: err.message || "Internal Server Error",
        code: "SERVER_ERROR"
      });
    });

    isSetup = true;
  } catch (err) {
    console.error("Setup error in Vercel function:", err);
    setupError = err;
    isSetup = false;
  }
})();

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (setupError) {
    return res.status(500).json({
      error: "Server failed to initialize.",
      details: setupError.message,
      code: "SETUP_FAILED"
    });
  }

  try {
    if (!isSetup) {
      await setupPromise;
    }

    if (setupError) {
      return res.status(500).json({
        error: "Server setup failed.",
        details: setupError.message,
        code: "SETUP_FAILED"
      });
    }

    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Handler Error:", error);
    res.status(500).json({
      error: "A server error occurred during request handling.",
      details: error.message,
      code: "HANDLER_ERROR"
    });
  }
}
