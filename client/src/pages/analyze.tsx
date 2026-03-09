import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMobile } from "@/hooks/use-mobile";
import {
    FileText, Upload, Sparkles, CheckCircle2, XCircle, AlertTriangle,
    BookOpen, Briefcase, Zap, Bot, Star, ListChecks, Check, Lightbulb,
    Loader2, Download, Copy, RefreshCw, Trash2, ArrowLeft, TrendingUp,
    Shield, KeyRound, ClipboardList
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResumeReport {
    score: number;
    atsCompatibility: { status: string; issues: string[]; passed: string[] };
    keywords: { found: string[]; missing: string[] };
    skills: { technical: number; soft: number; leadership: number };
    formatting: { score: number; feedback: string };
    actionPlan: string[];
    strengths?: string[];
    summary?: string;
}

interface MatchReport {
    matchScore: number;
    keywordGap: { skill: string; importance: string; found: boolean }[];
    pros: string[];
    cons: string[];
    summarySuggestion: string;
    interviewQuestions: string[];
}

// ─── Score Gauge ─────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
    const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                    <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="score-ring transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-bold">{score}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
            </div>
            <Badge className="mt-3" style={{ backgroundColor: color, color: "white" }}>{label}</Badge>
        </div>
    );
}

// ─── Analysis Steps ───────────────────────────────────────────────────────────
const loadingSteps = [
    "Parsing resume content...",
    "Checking ATS compatibility...",
    "Analyzing keywords & skills...",
    "Evaluating formatting quality...",
    "Generating action plan...",
    "Finalizing your report...",
];

function LoadingState() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s < loadingSteps.length - 1 ? s + 1 : s));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8 p-8">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Bot className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-display font-semibold">AI is analyzing...</h3>
                <p className="text-muted-foreground text-sm">{loadingSteps[step]}</p>
            </div>
            <div className="w-64 space-y-2">
                <Progress value={((step + 1) / loadingSteps.length) * 100} className="h-1.5" />
                <p className="text-xs text-center text-muted-foreground">Step {step + 1} of {loadingSteps.length}</p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analyze() {
    const isMobile = useMobile();
    const [resumeText, setResumeText] = useState("");
    const [jdText, setJdText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [resumeReport, setResumeReport] = useState<ResumeReport | null>(null);
    const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
    const [rewriteResult, setRewriteResult] = useState<any>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<"input" | "report">("input");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasReport = resumeReport !== null;

    // ── File Handling ────────────────────────────────────────────────────────
    const handleFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 5MB.");
            return;
        }
        setSelectedFile(file);
        setResumeText("");
        toast.success(`"${file.name}" ready for analysis`, { description: "Click 'Analyze' to proceed." });
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    // ── Analyze ──────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!resumeText.trim() && !selectedFile) {
            toast.error("Please provide your resume", { description: "Upload a file or paste your resume text." });
            return;
        }

        setIsAnalyzing(true);
        setResumeReport(null);
        setMatchReport(null);
        setRewriteResult(null);
        if (isMobile) setActiveMobileTab("report");

        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append("resume", selectedFile);
            } else {
                formData.append("resumeText", resumeText);
            }
            if (jdText.trim()) {
                formData.append("jobDescription", jdText);
            }

            const res = await fetch("/api/analyze", { method: "POST", body: formData });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Analysis failed");
            }

            const data = await res.json();

            // Save to localStorage
            const history = JSON.parse(localStorage.getItem("resumeiq-history") || "[]");
            history.unshift({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                fileName: data.fileName || selectedFile?.name || "Pasted text",
                score: data.resumeReport.score,
                matchScore: data.matchReport?.matchScore ?? null,
            });
            localStorage.setItem("resumeiq-history", JSON.stringify(history.slice(0, 50)));

            setResumeReport(data.resumeReport);
            setMatchReport(data.matchReport);
            setRewriteResult(data.rewriteResult); // Store pre-calculated rewrite

            toast.success("Analysis complete!", {
                description: `Your resume scored ${data.resumeReport.score}/100.`
            });
        } catch (error: any) {
            toast.error("Analysis failed", { description: error.message });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Auto-Rewrite ─────────────────────────────────────────────────────────
    const handleRewrite = async () => {
        if (!rewriteResult) {
            toast.info("Analyzing resume first...", { description: "Please wait for the analysis to complete." });
            return;
        }
        // The result is already present, we just scroll to it or ensure it's visible
        toast.success("AI Rewrite ready!", { description: "Review the suggestions in the panel below." });

        // Optional: Smooth scroll to the rewrite section
        const rewriteSection = document.querySelector('.rewrite-card');
        if (rewriteSection) {
            rewriteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // ── Export PDF ────────────────────────────────────────────────────────────
    const handleExportPDF = () => {
        window.print();
        toast.success("Print dialog opened", { description: "Save as PDF from your browser's print dialog." });
    };

    // ── Copy Summary ─────────────────────────────────────────────────────────
    const handleCopySummary = async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    // ── Reset ─────────────────────────────────────────────────────────────────
    const handleReset = () => {
        setResumeReport(null);
        setMatchReport(null);
        setRewriteResult(null);
        setSelectedFile(null);
        setResumeText("");
        setJdText("");
        setActiveMobileTab("input");
    };

    // ── ATS Status Color ──────────────────────────────────────────────────────
    const atsColor = (status: string) => {
        if (status === "Excellent") return "text-green-600";
        if (status === "Good") return "text-blue-600";
        if (status === "Needs Improvement") return "text-amber-600";
        return "text-red-600";
    };

    // ─── INPUT PANEL ─────────────────────────────────────────────────────────
    const InputPanel = (
        <div className="h-full flex flex-col p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-display font-bold">Input</h1>
                    <p className="text-muted-foreground text-xs mt-0.5">Upload or paste your resume</p>
                </div>
                {hasReport && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                )}
            </div>

            <Tabs defaultValue="resume" className="flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="resume" className="gap-2">
                        <FileText className="w-3.5 h-3.5" /> Resume
                    </TabsTrigger>
                    <TabsTrigger value="jd" className="gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Job Description
                        <span className="text-[9px] uppercase text-muted-foreground font-bold">opt</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="resume" className="flex-1 mt-0 flex flex-col gap-3">
                    {/* Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? "drag-active" : "border-muted hover:border-primary/40 hover:bg-primary/3"}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={handleFileInput} />
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                            <Upload className="w-5 h-5" />
                        </div>
                        {selectedFile ? (
                            <>
                                <p className="font-medium text-sm text-primary">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium text-sm">Drop your resume here</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT · Max 5MB</p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">or paste text</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <Textarea
                        placeholder="Paste your resume content here..."
                        className="flex-1 resize-none font-mono text-xs leading-relaxed min-h-[160px]"
                        value={resumeText}
                        onChange={(e) => { setResumeText(e.target.value); setSelectedFile(null); }}
                    />
                </TabsContent>

                <TabsContent value="jd" className="flex-1 mt-0 flex flex-col">
                    <Textarea
                        placeholder="Paste the job description here to get a tailored Job Match Report with skill gap analysis..."
                        className="flex-1 resize-none text-sm leading-relaxed min-h-[300px]"
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                    />
                    {jdText.trim() && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                            <CheckCircle2 className="w-3 h-3" /> Job match analysis will be included
                        </p>
                    )}
                </TabsContent>
            </Tabs>

            <div className="pt-4 mt-auto space-y-2">
                <Button
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 gap-2"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</>
                    ) : (
                        <><Zap className="w-5 h-5" /> Generate AI Analysis</>
                    )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    AI-Powered Analysis · Free · No signup
                </p>
            </div>
        </div>
    );

    // ─── RESULTS PANEL ────────────────────────────────────────────────────────
    const ResultsPanel = (
        <ScrollArea className="h-full w-full">
            <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-full analysis-report">

                {/* Empty state */}
                {!hasReport && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold mb-2">Your AI Career Coach</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Upload your resume on the left and click "Generate AI Analysis" to receive your comprehensive report.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full text-left">
                            {[
                                { icon: ListChecks, title: "Full Resume Audit", desc: "Score, ATS, keywords, formatting" },
                                { icon: Star, title: "Job Match Score", desc: "Skill gaps & tailored summary" },
                                { icon: Shield, title: "ATS Analysis", desc: "Passes or fails ATS scanners" },
                                { icon: Zap, title: "Action Plan", desc: "4 precise improvement steps" },
                            ].map((f) => (
                                <Card key={f.title} className="border shadow-sm">
                                    <CardContent className="p-3">
                                        <f.icon className="w-4 h-4 text-primary mb-1.5" />
                                        <p className="font-medium text-sm">{f.title}</p>
                                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading */}
                {isAnalyzing && <LoadingState />}

                {/* Results */}
                {hasReport && !isAnalyzing && resumeReport && (
                    <div className="space-y-6 pb-12 animate-in slide-in-from-bottom-6 fade-in duration-500">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                            <div>
                                <h2 className="text-2xl font-display font-bold">Analysis Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    {matchReport ? "Resume Audit & Job Match Analysis" : "Comprehensive Resume Audit"}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                                    <Download className="w-3.5 h-3.5" /> Export PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5" /> New Analysis
                                </Button>
                            </div>
                        </div>

                        {/* Summary if available */}
                        {resumeReport.summary && (
                            <Card className="border-none bg-gradient-to-br from-primary/5 to-transparent">
                                <CardContent className="p-4 text-sm text-muted-foreground italic leading-relaxed">
                                    <Bot className="w-4 h-4 text-primary mb-2" />
                                    {resumeReport.summary}
                                </CardContent>
                            </Card>
                        )}

                        {/* Score + Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center pb-6">
                                    <ScoreGauge score={resumeReport.score} />
                                </CardContent>
                            </Card>

                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* ATS Card */}
                                <Card className="shadow-sm border-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> ATS Compatibility
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-display font-bold mb-2 ${atsColor(resumeReport.atsCompatibility.status)}`}>
                                            {resumeReport.atsCompatibility.status}
                                        </div>
                                        <div className="space-y-1">
                                            {resumeReport.atsCompatibility.passed.slice(0, 2).map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> {p}
                                                </div>
                                            ))}
                                            {resumeReport.atsCompatibility.issues.slice(0, 1).map((iss, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> {iss}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Formatting Card */}
                                <Card className="shadow-sm border-none">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> Formatting
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-display font-bold mb-2">{resumeReport.formatting.score}/100</div>
                                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                            {resumeReport.formatting.feedback}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Strengths */}
                        {resumeReport.strengths && resumeReport.strengths.length > 0 && (
                            <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-950/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <TrendingUp className="w-4 h-4" /> Key Strengths
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {resumeReport.strengths.map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm">
                                                <Star className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Job Match */}
                        {matchReport && (
                            <Card className="border-primary/20 shadow-md shadow-primary/5 overflow-hidden">
                                <div className="bg-primary/5 border-b border-primary/10 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-display font-semibold">Job Match Analysis</h3>
                                            <p className="text-xs text-muted-foreground">Based on the job description you provided</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-display font-bold text-primary">{matchReport.matchScore}%</span>
                                        <span className="text-xs text-muted-foreground">match</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <Progress value={matchReport.matchScore} className="h-2 mb-4" />
                                </div>
                                <CardContent className="p-0">
                                    <Tabs defaultValue="gaps">
                                        <div className="px-4 md:px-6 border-b overflow-x-auto no-scrollbar">
                                            <TabsList className="bg-transparent h-auto p-0 gap-4 flex min-w-max">
                                                {[
                                                    { value: "gaps", label: "Skill Gaps" },
                                                    { value: "proscons", label: "Pros & Cons" },
                                                    { value: "summary", label: "AI Summary" },
                                                    { value: "interview", label: "Interview Prep" },
                                                ].map(t => (
                                                    <TabsTrigger key={t.value} value={t.value}
                                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm">
                                                        {t.label}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </div>
                                        <div className="p-4 md:p-6">
                                            <TabsContent value="gaps" className="mt-0">
                                                <div className="space-y-2">
                                                    {matchReport.keywordGap.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                                            <div className="flex items-center gap-3">
                                                                {item.found
                                                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                                                                <span className="font-medium text-sm">{item.skill}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className={`text-xs ${item.importance === 'High' ? 'border-orange-200 text-orange-700 bg-orange-50' : ''}`}>
                                                                    {item.importance}
                                                                </Badge>
                                                                <span className={`text-xs font-medium ${item.found ? 'text-green-600' : 'text-red-500'}`}>
                                                                    {item.found ? 'Found' : 'Missing'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="proscons" className="mt-0">
                                                <div className="grid sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-3 text-sm">
                                                            <Check className="w-4 h-4" /> Strong Matches
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {matchReport.pros.map((pro, i) => (
                                                                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                                    <span className="text-green-500 mt-0.5 shrink-0">•</span>{pro}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-3 text-sm">
                                                            <AlertTriangle className="w-4 h-4" /> Improvement Areas
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {matchReport.cons.map((con, i) => (
                                                                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                                    <span className="text-red-400 mt-0.5 shrink-0">•</span>{con}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="summary" className="mt-0">
                                                <div className="bg-muted/30 p-4 rounded-xl border">
                                                    <Badge className="mb-3">Tailored Summary</Badge>
                                                    <p className="text-sm leading-relaxed italic text-muted-foreground">"{matchReport.summarySuggestion}"</p>
                                                    <Button size="sm" variant="secondary" className="mt-4 gap-1.5 h-8 text-xs"
                                                        onClick={() => handleCopySummary(matchReport.summarySuggestion)}>
                                                        <Copy className="w-3 h-3" /> Copy to Clipboard
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="interview" className="mt-0">
                                                <p className="text-xs text-muted-foreground mb-4">Prepare for these role-specific interview questions:</p>
                                                <div className="space-y-3">
                                                    {matchReport.interviewQuestions.map((q, i) => (
                                                        <div key={i} className="border rounded-lg p-3 flex gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                                                                {i + 1}
                                                            </div>
                                                            <p className="text-sm leading-snug pt-0.5">{q}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {/* Skills & Keywords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="shadow-sm border-none">
                                <CardHeader>
                                    <CardTitle className="text-base">Skills Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {[
                                        { label: "Technical Skills", value: resumeReport.skills.technical, color: "bg-blue-500" },
                                        { label: "Soft Skills", value: resumeReport.skills.soft, color: "bg-green-500" },
                                        { label: "Leadership", value: resumeReport.skills.leadership, color: "bg-purple-500" },
                                    ].map((skill) => (
                                        <div key={skill.label} className="space-y-1.5">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{skill.label}</span>
                                                <span className="text-muted-foreground">{skill.value}%</span>
                                            </div>
                                            <Progress value={skill.value} className="h-2" />
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t">
                                        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Keywords Found</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {resumeReport.keywords.found.map((kw, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">{kw}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Missing Keywords</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {resumeReport.keywords.missing.map((kw, i) => (
                                                <Badge key={i} variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/20">{kw}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-none">
                                <CardHeader>
                                    <CardTitle className="text-base">Action Plan</CardTitle>
                                    <CardDescription>Steps to improve your resume right now</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {resumeReport.actionPlan.map((action, i) => (
                                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border hover:bg-white dark:hover:bg-zinc-900 hover:border-primary/30 transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm leading-relaxed">{action}</p>
                                        </div>
                                    ))}
                                    <Button
                                        className="w-full mt-2 gap-2"
                                        variant="outline"
                                        onClick={handleRewrite}
                                        disabled={isRewriting}
                                    >
                                        {isRewriting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting...</>
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> Auto-Rewrite with AI</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ATS Full Detail */}
                        <Card className="shadow-sm border-none">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" /> ATS Compatibility Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">✓ Passed</h4>
                                        <ul className="space-y-2">
                                            {resumeReport.atsCompatibility.passed.map((p, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">⚠ Issues Found</h4>
                                        <ul className="space-y-2">
                                            {resumeReport.atsCompatibility.issues.map((iss, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> {iss}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rewrite Result */}
                        {rewriteResult && (
                            <Card className="border-primary/20 shadow-md bg-primary/2 rewrite-card">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" /> AI-Rewritten Resume
                                    </CardTitle>
                                    <CardDescription>Here is your improved resume content</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted/30 rounded-lg p-4 border font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                                        {rewriteResult.rewrittenSection}
                                    </div>
                                    <Button size="sm" variant="outline" className="gap-1.5"
                                        onClick={() => handleCopySummary(rewriteResult.rewrittenSection)}>
                                        <Copy className="w-3 h-3" /> Copy Rewritten Text
                                    </Button>
                                    {rewriteResult.changes?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Changes Made</h4>
                                            <ul className="space-y-1">
                                                {rewriteResult.changes.map((c: string, i: number) => (
                                                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </ScrollArea>
    );

    // ── Mobile Tab Nav ───────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div className="flex flex-col h-screen">
                <Navbar />
                {hasReport && (
                    <div className="flex border-b bg-background">
                        {["input", "report"].map((tab) => (
                            <button
                                key={tab}
                                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${activeMobileTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                                onClick={() => setActiveMobileTab(tab as "input" | "report")}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    {activeMobileTab === "input" ? InputPanel : ResultsPanel}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <main className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={38} minSize={28} maxSize={50} className="bg-background">
                        {InputPanel}
                    </ResizablePanel>
                    <ResizableHandle withHandle className="bg-border" />
                    <ResizablePanel defaultSize={62} minSize={50} className="bg-slate-50/50 dark:bg-zinc-950/30">
                        {ResultsPanel}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}
