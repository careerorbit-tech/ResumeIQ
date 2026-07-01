import type { Express } from "express";
import { type Server } from "http";
import multer from "multer";
import { parsePdfToText } from "./lib/parser.js";
import {
  analyzeResume,
  matchJobDescription,
  rewriteResumeSection,
} from "./lib/groq.js";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Vercel's request body limit is 4.5MB; keep headroom for multipart overhead
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Only PDF, DOCX, and TXT files are allowed.`
        )
      );
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  console.log("[Routes] Registering routes...");

  // ── Health Check ────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      aiConfigured: !!process.env.GROQ_API_KEY,
      version: "1.0.0",
    });
  });

  // ── Analyze Resume ──────────────────────────────────────────────────────────
  app.post("/api/analyze", upload.single("resume"), async (req, res) => {
    try {
      // Validate GROQ_API_KEY early — return clean JSON, never crash
      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({
          success: false,
          message:
            "AI service is not configured. Please contact the site administrator.",
          code: "API_KEY_MISSING",
        });
      }

      const file = (req as Express.Request & { file?: Express.Multer.File })
        .file;
      let resumeText = (req.body.resumeText as string) || "";

      // Extract text from uploaded file
      if (file) {
        if (file.mimetype === "application/pdf") {
          console.time("[Routes] pdf-parse");
          try {
            resumeText = await parsePdfToText(file.buffer);
          } catch (parseError: unknown) {
            const msg =
              parseError instanceof Error
                ? parseError.message
                : "Failed to parse the uploaded PDF.";
            return res.status(422).json({
              success: false,
              message: msg,
              code: "PDF_PARSE_ERROR",
            });
          }
          console.timeEnd("[Routes] pdf-parse");
        } else {
          // DOCX / TXT — read as UTF-8
          resumeText = file.buffer.toString("utf-8");
        }
      }

      // Validate resume content
      const trimmed = resumeText.trim();
      if (!trimmed) {
        return res.status(400).json({
          success: false,
          message:
            "No resume content found. Please upload a file or paste your resume text.",
          code: "MISSING_RESUME",
        });
      }

      if (trimmed.length < 50) {
        return res.status(400).json({
          success: false,
          message:
            "The resume content is too short. Please provide a more complete resume (at least 50 characters).",
          code: "RESUME_TOO_SHORT",
        });
      }

      const jobDescription = (req.body.jobDescription as string) || "";

      // Run all AI tasks in parallel for speed
      const defaultInstruction =
        "Improve the overall quality, impact, and ATS compatibility of this resume. Make bullet points stronger with quantifiable achievements where possible.";

      console.time("[Routes] ai-parallel");
      const [resumeAnalysis, matchAnalysis, rewriteResult] = await Promise.all([
        analyzeResume(trimmed),
        jobDescription.trim()
          ? matchJobDescription(trimmed, jobDescription)
          : Promise.resolve(null),
        rewriteResumeSection(trimmed, defaultInstruction),
      ]);
      console.timeEnd("[Routes] ai-parallel");

      return res.json({
        success: true,
        resumeReport: resumeAnalysis,
        matchReport: matchAnalysis,
        rewriteResult,
        timestamp: new Date().toISOString(),
        fileName: file?.originalname ?? null,
        resumeText: trimmed,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during analysis.";

      console.error("[Routes] Analysis error:", message);

      // Never return HTML errors
      return res.status(500).json({
        success: false,
        message,
        code: "ANALYSIS_ERROR",
      });
    }
  });

  // ── Auto-Rewrite ────────────────────────────────────────────────────────────
  app.post("/api/rewrite", async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({
          success: false,
          message: "AI service is not configured.",
          code: "API_KEY_MISSING",
        });
      }

      const { resumeText, instruction } = req.body as {
        resumeText?: string;
        instruction?: string;
      };

      if (!resumeText?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Resume text is required for rewriting.",
          code: "MISSING_RESUME",
        });
      }

      const defaultInstruction =
        instruction?.trim() ||
        "Improve the overall quality, impact, and ATS compatibility of this resume. Make bullet points stronger with quantifiable achievements where possible.";

      const result = await rewriteResumeSection(resumeText, defaultInstruction);
      return res.json({ success: true, ...result });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to rewrite resume.";
      console.error("[Routes] Rewrite error:", message);
      return res.status(500).json({
        success: false,
        message,
        code: "REWRITE_ERROR",
      });
    }
  });

  // ── Analysis History (client-side localStorage only) ─────────────────────
  // NOTE: History is stored in the browser's localStorage, not on the server.
  // These endpoints are kept for API completeness but always return empty.
  app.get("/api/history", (_req, res) => {
    res.json({ analyses: [] });
  });

  app.delete("/api/history", (_req, res) => {
    res.json({ success: true, message: "History cleared." });
  });

  console.log("[Routes] Routes registered successfully.");
  return httpServer;
}
