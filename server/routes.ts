import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parsePdfToText } from "./lib/parser";
import { analyzeResume, matchJobDescription, rewriteResumeSection } from "./lib/groq";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed."));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      aiConfigured: !!process.env.GROQ_API_KEY,
      version: "1.0.0",
    });
  });

  // ── Analyze Resume ────────────────────────────────────────────────────────
  app.post("/api/analyze", upload.single("resume"), async (req, res) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      let resumeText = (req.body.resumeText as string) || "";

      if (file) {
        const mime = file.mimetype;
        if (mime === "application/pdf") {
          resumeText = await parsePdfToText(file.buffer);
        } else {
          resumeText = file.buffer.toString("utf-8");
        }
      }

      if (!resumeText.trim()) {
        return res.status(400).json({
          error: "No resume content provided. Please upload a file or paste resume text.",
          code: "MISSING_RESUME",
        });
      }

      if (resumeText.trim().length < 50) {
        return res.status(400).json({
          error: "Resume content is too short. Please provide a more complete resume.",
          code: "RESUME_TOO_SHORT",
        });
      }

      const jobDescription = (req.body.jobDescription as string) || "";

      const [resumeAnalysis, matchAnalysis] = await Promise.all([
        analyzeResume(resumeText),
        jobDescription.trim()
          ? matchJobDescription(resumeText, jobDescription)
          : Promise.resolve(null),
      ]);

      // Automatically generate a rewrite during the main analysis request
      const rewriteInstruction = resumeAnalysis.actionPlan?.join("; ") ||
        "Improve overall quality and ATS compatibility.";
      const rewriteResult = await rewriteResumeSection(resumeText, rewriteInstruction);

      const result = {
        resumeReport: resumeAnalysis,
        matchReport: matchAnalysis,
        rewriteResult: rewriteResult, // Include rewrite in the main response
        timestamp: new Date().toISOString(),
        fileName: file?.originalname ?? null,
        resumeText: resumeText,
      };

      // Save to in-memory history
      await storage.saveAnalysis({
        id: randomUUID(),
        timestamp: result.timestamp,
        fileName: result.fileName,
        score: resumeAnalysis.score as number,
        matchScore: (matchAnalysis as any)?.matchScore ?? null,
        resumeReport: resumeAnalysis,
        matchReport: matchAnalysis,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      if (error.message?.includes("API key")) {
        return res
          .status(503)
          .json({ error: error.message, code: "API_KEY_ERROR" });
      }
      res.status(500).json({
        error: error.message || "An error occurred during analysis",
        code: "ANALYSIS_ERROR",
      });
    }
  });

  // ── Auto-Rewrite with AI ──────────────────────────────────────────────────
  app.post("/api/rewrite", async (req, res) => {
    try {
      const { resumeText, instruction } = req.body as {
        resumeText?: string;
        instruction?: string;
      };

      if (!resumeText?.trim()) {
        return res.status(400).json({
          error: "Resume text is required.",
          code: "MISSING_RESUME",
        });
      }

      const defaultInstruction =
        instruction?.trim() ||
        "Improve the overall quality, impact, and ATS compatibility of this resume. Make bullet points stronger with quantifiable achievements where possible.";

      const result = await rewriteResumeSection(resumeText, defaultInstruction);
      res.json(result);
    } catch (error: any) {
      console.error("Rewrite Error:", error);
      res.status(500).json({
        error: error.message || "Failed to rewrite resume.",
        code: "REWRITE_ERROR",
      });
    }
  });

  // ── Analysis History ──────────────────────────────────────────────────────
  app.get("/api/history", async (_req, res) => {
    try {
      const analyses = await storage.getAnalyses();
      res.json({ analyses });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to fetch history.",
        code: "HISTORY_ERROR",
      });
    }
  });

  app.delete("/api/history", async (_req, res) => {
    try {
      await storage.clearAnalyses();
      res.json({ message: "History cleared successfully." });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to clear history.",
        code: "HISTORY_ERROR",
      });
    }
  });

  return httpServer;
}
