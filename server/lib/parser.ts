/**
 * PDF text extraction using pdfjs-dist directly.
 *
 * WHY: pdf-parse v2 depends on @napi-rs/canvas (a native C++ addon that
 * requires libcairo/libpango system libraries). These are NOT available in
 * Vercel's serverless Lambda environment, causing FUNCTION_INVOCATION_FAILED
 * on every cold start.
 *
 * pdfjs-dist is pure JavaScript — no native addons, works everywhere.
 * The dynamic import ensures the module is never loaded at module-init time,
 * which protects the serverless cold start even further.
 */
export async function parsePdfToText(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import — defers module loading to call time, not cold-start time.
        // We use the "legacy" build which runs fully in the main thread
        // (no Web Worker required — safe for serverless environments).
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

        // Belt-and-suspenders: disable any worker fallback attempt.
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";

        const data = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({
            data,
            useWorkerFetch: false,   // no fetch API in Node.js
            isEvalSupported: false,  // safer in restricted environments
            useSystemFonts: true,    // avoid font loading in serverless
        });

        const pdfDoc = await loadingTask.promise;
        console.log(`[Parser] Parsing PDF with ${pdfDoc.numPages} page(s)`);

        const pageTexts: string[] = [];
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => ("str" in item ? item.str : ""))
                .join(" ");
            if (pageText.trim()) {
                pageTexts.push(pageText.trim());
            }
        }

        await pdfDoc.destroy();
        const result = pageTexts.join("\n\n");
        console.log(`[Parser] Extracted ${result.length} characters from PDF`);
        return result;
    } catch (error: any) {
        console.error("PDF Parsing error:", error);
        throw new Error("Failed to parse PDF document: " + error.message);
    }
}
