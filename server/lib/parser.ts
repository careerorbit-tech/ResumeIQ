import * as pdfParse from "pdf-parse";

// Polyfill for DOMMatrix which is required by some PDF libraries in Node.js environments
if (typeof global !== "undefined" && typeof (global as any).DOMMatrix === "undefined") {
    console.log("Applying DOMMatrix polyfill for PDF parsing...");
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
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
        const parse = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
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
