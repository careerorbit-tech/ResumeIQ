import pdf from "pdf-parse";

/**
 * PDF text extraction using pdf-parse@1.1.1.
 *
 * WHY: We use version 1.1.1 specifically because it is pure JavaScript and
 * does not have native dependencies like @napi-rs/canvas (introduced in later versions).
 * This makes it perfectly safe for Vercel's serverless environment.
 */
export async function parsePdfToText(buffer: Buffer): Promise<string> {
    try {
        console.log("[Parser] Starting PDF parsing with pdf-parse...");

        // pdf-parse@1.1.1 is straightforward and doesn't require worker configuration
        const data = await pdf(buffer);

        console.log(`[Parser] Extracted ${data.text?.length || 0} characters from PDF`);
        return data.text || "";
    } catch (error: any) {
        console.error("PDF Parsing error:", error);
        throw new Error("Failed to parse PDF document: " + error.message);
    }
}
