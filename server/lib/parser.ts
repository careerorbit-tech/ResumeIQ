// WHY: We import directly from 'pdf-parse/lib/pdf-parse.js' (the actual library)
// instead of 'pdf-parse' (the index.js entrypoint).
//
// pdf-parse@1.1.1 has a critical bug in its index.js:
//   let isDebugMode = !module.parent;
// In ESM/serverless environments (Vercel), module.parent is always undefined,
// so isDebugMode is always true. This causes it to try:
//   fs.readFileSync('./test/data/05-versions-space.pdf')
// which does not exist on Vercel, producing ENOENT and crashing the function.
//
// Importing from /lib/pdf-parse.js bypasses index.js entirely and directly
// accesses the pure parsing library — no test file references, no side effects.

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse: (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }> =
  require("pdf-parse/lib/pdf-parse.js");

const MAX_TEXT_LENGTH = 15_000; // cap to avoid sending massive prompts to the AI

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * Safe for Vercel Serverless — no filesystem side effects.
 */
export async function parsePdfToText(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF buffer is empty.");
  }

  if (buffer.length < 100) {
    throw new Error("File appears to be too small or corrupted.");
  }

  // Verify PDF magic bytes: all PDFs start with %PDF
  const header = buffer.slice(0, 5).toString("ascii");
  if (!header.startsWith("%PDF")) {
    throw new Error(
      "File does not appear to be a valid PDF. Please ensure you are uploading a real PDF document."
    );
  }

  console.log(
    `[Parser] Parsing PDF buffer: ${(buffer.length / 1024).toFixed(1)} KB`
  );

  try {
    const data = await pdfParse(buffer, {
      // Disable test mode — we only need text extraction
      max: 0,
    });

    const rawText = data.text || "";
    console.log(
      `[Parser] Extracted ${rawText.length} characters from ${data.numpages} page(s).`
    );

    if (!rawText.trim()) {
      throw new Error(
        "Could not extract text from this PDF. The file may be image-based or encrypted. Please paste the resume text directly instead."
      );
    }

    // Normalize whitespace and cap length for AI prompts
    const normalized = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return normalized.length > MAX_TEXT_LENGTH
      ? normalized.slice(0, MAX_TEXT_LENGTH)
      : normalized;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Re-throw our own descriptive errors unchanged
      if (
        error.message.includes("text from this PDF") ||
        error.message.includes("valid PDF") ||
        error.message.includes("too small")
      ) {
        throw error;
      }
      console.error("[Parser] pdf-parse error:", error.message);
      throw new Error(
        "Failed to parse PDF. The file may be corrupted or use an unsupported format."
      );
    }
    throw new Error("An unexpected error occurred while parsing the PDF.");
  }
}
