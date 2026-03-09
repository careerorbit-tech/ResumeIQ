import * as pdfParse from "pdf-parse";

// Polyfill for DOMMatrix which is required by newer Node.js versions for pdf-parse
if (typeof global !== "undefined" && typeof (global as any).DOMMatrix === "undefined") {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
    };
}

export async function parsePdfToText(buffer: Buffer): Promise<string> {
    try {
        // Handle the new pdf-parse API (v2.x)
        if (pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse({ data: buffer });
            const result = await parser.getText();
            return result.text;
        }

        // Handle the old pdf-parse API (v1.x) or potential variations
        const parse = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
        if (typeof parse === 'function') {
            const data = await parse(buffer);
            return data.text;
        }

        throw new Error("Could not find a valid PDF parsing function in pdf-parse");
    } catch (error: any) {
        console.error("PDF Parsing error:", error);
        throw new Error("Failed to parse PDF document.");
    }
}
