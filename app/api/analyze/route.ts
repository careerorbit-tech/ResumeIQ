import { NextRequest, NextResponse } from "next/server";
import { analyzeResume, matchJobDescription, rewriteResumeSection } from "@server/lib/groq";
import pdf from "pdf-parse";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Extend to 30s if supported by the Vercel plan

export async function POST(req: NextRequest) {
    console.log("[API] /api/analyze HIT");

    try {
        // 1. API Key Check
        if (!process.env.GROQ_API_KEY) {
            console.error("[API] Missing GROQ_API_KEY");
            return NextResponse.json({ error: "Groq API key is not configured." }, { status: 500 });
        }

        // 2. Handle Multi-part Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const resumeTextRaw = formData.get("resumeText") as string | null;
        const jobDescription = (formData.get("jobDescription") as string) || "";

        console.log("[API] File received:", !!file, "Resume text raw:", !!resumeTextRaw);

        let resumeText = resumeTextRaw || "";

        // 3. Extract Text from PDF if necessary
        if (file && file.type === "application/pdf") {
            const buffer = Buffer.from(await file.arrayBuffer());

            console.log(`[API] Parsing PDF (${(buffer.length / 1024).toFixed(1)} KB)...`);

            try {
                // pdf-parse@1.1.1 is straightforward when given a buffer
                const data = await pdf(buffer);
                resumeText = data.text || "";
                console.log(`[API] Extracted ${resumeText.length} characters from PDF`);
            } catch (pdfError: any) {
                console.error("[API] pdf-parse error:", pdfError);
                // Fallback or specific error if needed
                throw new Error("Failed to extract text from PDF: " + pdfError.message);
            }
        } else if (file) {
            // Text or DOCX (assuming fallback to text for now)
            resumeText = await file.text();
        }

        if (!resumeText.trim()) {
            return NextResponse.json({ error: "No resume content found." }, { status: 400 });
        }

        // 4. Run Analysis Calls in Parallel
        console.time("[API] ai-parallel");
        const defaultRewriteInstruction = "Improve the overall quality, impact, and ATS compatibility of this resume. Make bullet points stronger with quantifiable achievements where possible.";

        const [resumeAnalysis, matchAnalysis, rewriteResult] = await Promise.all([
            analyzeResume(resumeText),
            jobDescription.trim()
                ? matchJobDescription(resumeText, jobDescription)
                : Promise.resolve(null),
            rewriteResumeSection(resumeText, defaultRewriteInstruction)
        ]);
        console.timeEnd("[API] ai-parallel");

        // 5. Final Response
        return NextResponse.json({
            resumeReport: resumeAnalysis,
            matchReport: matchAnalysis,
            rewriteResult: rewriteResult,
            timestamp: new Date().toISOString(),
            fileName: file?.name ?? "Pasted text",
            resumeText: resumeText,
        });

    } catch (error: any) {
        console.error("[API] CRITICAL ERROR:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "An internal error occurred during analysis",
            code: "ANALYSIS_FAILED"
        }, { status: 500 });
    }
}
