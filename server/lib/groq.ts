import Groq from "groq-sdk";

// Initialize Groq client safely
const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const MODEL = "llama-3.3-70b-versatile";

export async function analyzeResume(resumeText: string) {
    console.log(`[Groq] Using model: ${MODEL} for analyzeResume`);
    const apiKey = process.env.GROQ_API_KEY;
    if (!groq || !apiKey || apiKey === "your_api_key_here") {
        throw new Error("Groq API key is not configured or is invalid. Please check your GROQ_API_KEY environment variable.");
    }

    const prompt = `
You are an expert AI Career Coach and ATS optimizer.
Please analyze the following resume text and provide a comprehensive report in structured JSON format. 
The JSON must strictly match this schema:

{
  "score": number, // Overall resume score out of 100
  "atsCompatibility": {
    "status": string, // "Excellent", "Good", "Needs Improvement", or "Poor"
    "issues": string[], // List of ATS parsing issues found (2-4 items)
    "passed": string[] // List of good ATS practices found (2-4 items)
  },
  "keywords": {
    "found": string[], // Relevant professional keywords found (5-10 items)
    "missing": string[] // Suggested keywords that are missing (4-6 items)
  },
  "skills": {
    "technical": number, // Score out of 100
    "soft": number, // Score out of 100
    "leadership": number // Score out of 100
  },
  "formatting": {
    "score": number, // Formatting score out of 100
    "feedback": string // 2-3 sentence feedback on formatting quality
  },
  "actionPlan": string[], // 4 specific, actionable steps to improve the resume
  "strengths": string[], // 3 key strengths of the resume
  "summary": string // A 2-sentence professional summary of the candidate's profile
}

Resume Text:
${resumeText}
`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: MODEL,
        response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Failed to generate analysis from Groq.");
    }

    return JSON.parse(content);
}

export async function matchJobDescription(resumeText: string, jobDescription: string) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!groq || !apiKey || apiKey === "your_api_key_here") {
        throw new Error("Groq API key is not configured or is invalid. Please check your GROQ_API_KEY environment variable.");
    }

    const prompt = `
You are an expert technical recruiter and AI matching system.
Please compare the following resume against the provided job description and return a detailed match report in structured JSON format.
The JSON must strictly match this schema:

{
  "matchScore": number, // Job match score out of 100
  "keywordGap": [
    { 
      "skill": string, 
      "importance": string, // "High", "Medium", or "Low"
      "found": boolean 
    }
  ], // Analyze 8-12 skills
  "pros": string[], // 3-4 strings detailing why they are a good fit
  "cons": string[], // 2-3 strings detailing missing requirements or experience
  "summarySuggestion": string, // A tailored professional summary paragraph they can use
  "interviewQuestions": string[] // 4 likely interview questions based on the role and gaps
}

Job Description:
${jobDescription}

Resume Text:
${resumeText}
`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: MODEL,
        response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Failed to generate match report from Groq.");
    }

    return JSON.parse(content);
}

export async function rewriteResumeSection(resumeText: string, instruction: string) {
    console.log(`[Groq] Using model: ${MODEL} for rewriteResumeSection`);
    const apiKey = process.env.GROQ_API_KEY;
    if (!groq || !apiKey || apiKey === "your_api_key_here") {
        throw new Error("Groq API key is not configured or is invalid. Please check your GROQ_API_KEY environment variable.");
    }

    const prompt = `
You are an expert career coach and professional resume writer.
I will provide you with the full text of a resume below.
Please analyze this text and break it down into logical sections (e.g., Summary, Experience, Skills, Education).
Improve and rewrite EACH section based on this instruction: "${instruction}"

CRITICAL RULES for rewriting:
1. DO NOT invent or assume any facts, dates, companies, or roles not present in the original text.
2. Maintain all technical keywords and specific technologies mentioned.
3. Focus on making bullet points "achievement-oriented" using the STAR method (Situation, Task, Action, Result) where possible.
4. Use strong action verbs (e.g., "Spearheaded", "Optimized", "Architected").
5. Improve the grammar and professional tone to be executive-level.
6. Ensure the result is highly ATS-optimized.

Return the result as a STRICT JSON object with this schema:
{
  "sections": [
    {
      "name": string, // Section name (e.g., "Summary", "Professional Experience")
      "originalText": string, // The original text for this section
      "rewrittenText": string, // The improved version
      "improvements": string[] // 2-3 bullet points on what was improved
    }
  ]
}

RESUME CONTENT TO REWRITE:
${resumeText}
`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: MODEL,
        response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Failed to generate rewrite from Groq.");
    }

    const parsed = JSON.parse(content);

    // Transform the section-wise output into the single block format the frontend expects
    const rewrittenSection = parsed.sections
        ?.map((s: any) => `${s.name ? `### ${s.name}\n` : ""}${s.rewrittenText}`)
        .join("\n\n") || "No content generated.";

    const changes = parsed.sections?.flatMap((s: any) => s.improvements || []) || [];

    return {
        rewrittenSection,
        changes
    };
}
