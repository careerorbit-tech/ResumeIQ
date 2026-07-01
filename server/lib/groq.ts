import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";
const MAX_RESUME_LENGTH = 15_000;
const REQUEST_TIMEOUT_MS = 55_000; // Just under Vercel's 60s function timeout

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface ResumeAnalysis {
  score: number;
  atsCompatibility: {
    status: string;
    issues: string[];
    passed: string[];
  };
  keywords: {
    found: string[];
    missing: string[];
  };
  skills: {
    technical: number;
    soft: number;
    leadership: number;
  };
  formatting: {
    score: number;
    feedback: string;
  };
  actionPlan: string[];
  strengths: string[];
  summary: string;
}

export interface MatchAnalysis {
  matchScore: number;
  keywordGap: Array<{ skill: string; importance: string; found: boolean }>;
  pros: string[];
  cons: string[];
  summarySuggestion: string;
  interviewQuestions: string[];
}

export interface RewriteResult {
  rewrittenSection: string;
  changes: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a fresh Groq client, validating the API key at call time.
 * Lazy initialization avoids module-load failures on Vercel cold starts.
 */
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here" || apiKey.trim().length < 10) {
    throw new Error(
      "GROQ_API_KEY is not configured. Please add it to your Vercel environment variables."
    );
  }
  return new Groq({ apiKey });
}

/**
 * Sanitize resume text: trim, normalize whitespace, cap length.
 */
function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, MAX_RESUME_LENGTH);
}

/**
 * Safely parse JSON from a Groq response. Throws a descriptive error if malformed.
 */
function parseGroqJson<T>(content: string | null | undefined, context: string): T {
  if (!content) {
    throw new Error(`No content returned from AI for ${context}.`);
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    console.error(`[Groq] Malformed JSON for ${context}:`, content.slice(0, 200));
    throw new Error(`AI returned malformed response for ${context}. Please try again.`);
  }
}

/**
 * Translate Groq/network errors into user-friendly messages.
 */
function handleGroqError(error: unknown, context: string): never {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Never expose the API key
    if (msg.includes("api_key") || msg.includes("apikey")) {
      throw new Error("AI service authentication failed. Please contact support.");
    }
    if (msg.includes("rate_limit") || msg.includes("rate limit") || msg.includes("429")) {
      throw new Error("AI service is busy. Please wait a moment and try again.");
    }
    if (msg.includes("timeout") || msg.includes("aborted") || msg.includes("etimedout")) {
      throw new Error(
        "The AI analysis took too long to respond. Your resume may be very long — try trimming it."
      );
    }
    if (msg.includes("503") || msg.includes("service unavailable")) {
      throw new Error("AI service is temporarily unavailable. Please try again in a few seconds.");
    }

    console.error(`[Groq] Error in ${context}:`, error.message);
    throw new Error(`Unable to complete ${context}. Please try again.`);
  }
  throw new Error(`An unexpected error occurred in ${context}.`);
}

// ─── Exported Functions ───────────────────────────────────────────────────────

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  console.log(`[Groq] analyzeResume — model: ${MODEL}`);
  const groq = getGroqClient();
  const safeText = sanitizeText(resumeText);

  const prompt = `You are an expert AI Career Coach and ATS optimizer.
Analyze the following resume text and provide a comprehensive report in structured JSON format.
The JSON must strictly match this schema:

{
  "score": number,
  "atsCompatibility": {
    "status": string,
    "issues": string[],
    "passed": string[]
  },
  "keywords": {
    "found": string[],
    "missing": string[]
  },
  "skills": {
    "technical": number,
    "soft": number,
    "leadership": number
  },
  "formatting": {
    "score": number,
    "feedback": string
  },
  "actionPlan": string[],
  "strengths": string[],
  "summary": string
}

CRITICAL DISTINCTION — These two fields are DIFFERENT:

1. atsCompatibility.issues = STRUCTURAL / FORMATTING problems that prevent ATS software from parsing the resume correctly.
   Examples: "No clear section headers", "Using tables or columns that ATS cannot read", "Missing contact information", "Special characters or graphics in headers", "Inconsistent date formatting", "No measurable results in bullet points"
   These are about HOW the resume is structured, NOT about content.

2. keywords.missing = INDUSTRY / ROLE-SPECIFIC professional keywords and skills that are NOT present in the resume but are commonly required for this type of role.
   Examples: "Python", "AWS", "Agile methodology", " stakeholder management", "CI/CD"
   These are about WHAT skills/terms are absent from the content.

RULES:
- score: Overall resume quality out of 100
- atsCompatibility.status: "Excellent", "Good", "Needs Improvement", or "Poor"
- atsCompatibility.issues: 2-4 STRUCTURAL/FORMATTING problems (NOT keyword gaps)
- atsCompatibility.passed: 2-4 good ATS structural practices
- keywords.found: 5-10 relevant professional keywords found in the resume
- keywords.missing: 4-6 missing industry/role-specific keywords (NOT structural issues)
- skills.*: scores out of 100
- formatting.feedback: 2-3 sentence feedback on visual formatting quality
- actionPlan: 4 specific, actionable improvement steps
- strengths: 3 key strengths
- summary: 2-sentence professional summary

Resume Text:
${safeText}`;

  try {
    const completion = await groq.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    const content = completion.choices[0]?.message?.content;
    return parseGroqJson<ResumeAnalysis>(content, "resume analysis");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Resume analysis timed out. Please try again with a shorter resume.");
    }
    handleGroqError(error, "resume analysis");
  }
}

export async function matchJobDescription(
  resumeText: string,
  jobDescription: string
): Promise<MatchAnalysis> {
  console.log(`[Groq] matchJobDescription — model: ${MODEL}`);
  const groq = getGroqClient();
  const safeResume = sanitizeText(resumeText);
  const safeJD = jobDescription.trim().slice(0, 8_000);

  const prompt = `You are an expert technical recruiter and AI matching system.
Compare the resume against the job description and return a detailed match report in structured JSON format.
The JSON must strictly match this schema:

{
  "matchScore": number,
  "keywordGap": [
    { "skill": string, "importance": string, "found": boolean }
  ],
  "pros": string[],
  "cons": string[],
  "summarySuggestion": string,
  "interviewQuestions": string[]
}

Rules:
- matchScore: 0-100 job match percentage
- keywordGap: Analyze 8-12 skills; importance is "High", "Medium", or "Low"
- pros: 3-4 reasons they are a good fit
- cons: 2-3 missing requirements or experience gaps
- summarySuggestion: A tailored professional summary paragraph
- interviewQuestions: 4 likely interview questions based on role and gaps

Job Description:
${safeJD}

Resume Text:
${safeResume}`;

  try {
    const completion = await groq.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    const content = completion.choices[0]?.message?.content;
    return parseGroqJson<MatchAnalysis>(content, "job match analysis");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Job match analysis timed out. Please try again.");
    }
    handleGroqError(error, "job match analysis");
  }
}

export async function rewriteResumeSection(
  resumeText: string,
  instruction: string
): Promise<RewriteResult> {
  console.log(`[Groq] rewriteResumeSection — model: ${MODEL}`);
  const groq = getGroqClient();
  const safeText = sanitizeText(resumeText);
  const safeInstruction = instruction.trim().slice(0, 500);

  const prompt = `You are an expert career coach and professional resume writer.
Analyze the resume text and break it down into logical sections.
Improve and rewrite EACH section based on this instruction: "${safeInstruction}"

CRITICAL RULES:
1. DO NOT invent or assume any facts, dates, companies, or roles not present in the original text.
2. Maintain all technical keywords and specific technologies mentioned.
3. Focus on achievement-oriented bullet points using the STAR method where possible.
4. Use strong action verbs (e.g., "Spearheaded", "Optimized", "Architected").
5. Improve grammar and professional tone to be executive-level.
6. Ensure the result is highly ATS-optimized.

Return a STRICT JSON object with this schema:
{
  "sections": [
    {
      "name": string,
      "originalText": string,
      "rewrittenText": string,
      "improvements": string[]
    }
  ]
}

RESUME CONTENT:
${safeText}`;

  try {
    const completion = await groq.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.4,
      },
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    const content = completion.choices[0]?.message?.content;
    const parsed = parseGroqJson<{
      sections: Array<{
        name?: string;
        rewrittenText?: string;
        improvements?: string[];
      }>;
    }>(content, "resume rewrite");

    const rewrittenSection =
      parsed.sections
        ?.map((s) => `${s.name ? `### ${s.name}\n` : ""}${s.rewrittenText ?? ""}`)
        .join("\n\n") || "No content generated.";

    const changes = parsed.sections?.flatMap((s) => s.improvements ?? []) ?? [];

    return { rewrittenSection, changes };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Resume rewrite timed out. Please try again.");
    }
    handleGroqError(error, "resume rewrite");
  }
}
