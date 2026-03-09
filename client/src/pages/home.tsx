import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, Settings, Sparkles, CheckCircle2, XCircle, AlertTriangle, ArrowRight, BookOpen, Briefcase, Zap, Bot, Star, ListChecks, Check, Lightbulb, Loader2 as Spinner } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeReport, setResumeReport] = useState<any>(null);
  const [matchReport, setMatchReport] = useState<any>(null);
  const [reportType, setReportType] = useState<"none" | "resume" | "match">("none");
  const isMobile = useMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<"input" | "report">("input");

  useEffect(() => {
    if (reportType !== "none" && isMobile) {
      setActiveMobileTab("report");
    }
  }, [reportType, isMobile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResumeText(""); // clear if taking file
    toast({
      title: "File Selected",
      description: `${file.name} is ready for analysis.`,
    });
  };

  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenSections, setRewrittenSections] = useState<any[]>([]);
  const [isRewriteDialogOpen, setIsRewriteDialogOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please provide your resume by uploading a file or pasting text.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setReportType("none");

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

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await res.json();

      setResumeReport(data.resumeReport);
      if (data.resumeText) {
        setResumeText(data.resumeText);
      }
      if (data.matchReport) {
        setMatchReport(data.matchReport);
        setReportType("match");
      } else {
        setReportType("resume");
      }

      toast({
        title: "AI Analysis Complete",
        description: "ResumeIQ has finished analyzing your profile using AI."
      });
    } catch (error: any) {
      console.error("Analysis Error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (!resumeText.trim() && !resumeReport) {
      toast({
        title: "No Content",
        description: "Please analyze a resume first to extract sections.",
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumeText }),
      });

      if (!res.ok) throw new Error("Rewrite failed");

      const data = await res.json();
      setRewrittenSections(data.sections);
      setIsRewriteDialogOpen(true);

      toast({
        title: "Rewrite Complete",
        description: "AI has generated improvements section-by-section."
      });
    } catch (error: any) {
      toast({
        title: "Rewrite Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const applySection = (newText: string) => {
    // Basic implementation: append or replace based on user preference
    // For now, we'll just track what we apply
    setResumeText(prev => prev + "\n\n" + newText);
    toast({ title: "Section Applied", description: "The improved section has been added to your resume." });
  };

  return (
    <div className="flex flex-col h-screen bg-muted/20 overflow-hidden">
      {/* Header */}
      <header className="flex-none h-16 border-b bg-background flex items-center justify-between px-6 z-10 relative shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">ResumeIQ</span>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-green-50 text-green-700 border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            AI System Online
          </Badge>

          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {isMobile && reportType !== "none" && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex bg-background/80 backdrop-blur-md border rounded-full shadow-2xl p-1">
            <Button
              variant={activeMobileTab === "input" ? "default" : "ghost"}
              size="sm"
              className="rounded-full px-6"
              onClick={() => setActiveMobileTab("input")}
            >
              Input
            </Button>
            <Button
              variant={activeMobileTab === "report" ? "default" : "ghost"}
              size="sm"
              className="rounded-full px-6"
              onClick={() => setActiveMobileTab("report")}
            >
              Report
            </Button>
          </div>
        )}

        <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="h-full w-full">
          {/* Left Panel: Inputs */}
          <ResizablePanel
            defaultSize={isMobile ? 100 : 40}
            minSize={isMobile ? 0 : 30}
            maxSize={isMobile ? 100 : 50}
            className={`bg-background relative ${isMobile && activeMobileTab !== "input" ? "hidden" : ""}`}
          >
            <div className="h-full flex flex-col p-4 md:p-6 max-w-2xl mx-auto">
              <div className="mb-4 md:mb-6 space-y-1">
                <h1 className="text-xl md:text-2xl font-bold font-display">Input Data</h1>
                <p className="text-muted-foreground text-xs md:text-sm">Paste your resume and optionally a job description.</p>
              </div>

              <Tabs defaultValue="resume" className="flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                  <TabsTrigger value="resume" className="gap-2" data-testid="tab-resume">
                    <FileText className="w-4 h-4" />
                    Resume
                  </TabsTrigger>
                  <TabsTrigger value="jd" className="gap-2" data-testid="tab-jd">
                    <Briefcase className="w-4 h-4" />
                    Job Description <span className="ml-1 text-[10px] uppercase text-muted-foreground font-semibold">(Opt)</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resume" className="flex-1 mt-0 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col h-full gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {isUploading ? <Spinner className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <h3 className="font-semibold text-base mb-1">{selectedFile ? selectedFile.name : 'Upload Resume'}</h3>
                        <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, or TXT up to 5MB</p>
                        <Button variant="outline" size="sm" asChild>
                          <span>{selectedFile ? 'Change File' : 'Browse Files'}</span>
                        </Button>
                      </div>
                    </label>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-muted"></div>
                      <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-semibold tracking-wider">Or paste text</span>
                      <div className="flex-grow border-t border-muted"></div>
                    </div>
                    <Textarea
                      placeholder="Paste your resume content here..."
                      className="flex-1 resize-none font-mono text-sm leading-relaxed p-4"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      data-testid="input-resume-text"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="jd" className="flex-1 mt-0 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col h-full">
                    <Textarea
                      placeholder="Paste the job description here to get a tailored Match Report..."
                      className="flex-1 resize-none text-sm p-4 leading-relaxed"
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      data-testid="input-jd-text"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-6 mt-auto">
                <Button
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isUploading}
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <Bot className="w-5 h-5 animate-bounce" />
                      AI is Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Generate AI Analysis
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  AI-Powered Analysis. Free for all users.
                </p>
              </div>
            </div>
          </ResizablePanel>

          {!isMobile && <ResizableHandle withHandle className="bg-border" />}

          {/* Right Panel: Results */}
          <ResizablePanel
            defaultSize={isMobile ? 100 : 60}
            minSize={isMobile ? 0 : 50}
            className={`bg-slate-50/50 dark:bg-zinc-950 ${isMobile && activeMobileTab !== "report" ? "hidden" : ""}`}
          >
            <ScrollArea className="h-full w-full">
              <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-full">

                {reportType === "none" && !isAnalyzing && (
                  <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center border">
                      <Bot className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div className="space-y-3 md:space-y-4 px-4">
                      <h2 className="text-2xl md:text-3xl font-display font-bold">Your AI Career Coach</h2>
                      <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                        Analyze your resume and job matches with AI.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
                      <Card className="bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-primary" />
                            Full Resume Audit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                          Get scored on formatting, keywords, ATS compatibility, and impact.
                        </CardContent>
                      </Card>
                      <Card className="bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Star className="w-4 h-4 text-primary" />
                            Job Match Scoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                          Identify skill gaps and get tailored suggestions for specific roles.
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <Bot className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold font-display">Analyzing your profile...</h3>
                      <p className="text-muted-foreground text-sm">Evaluating ATS readability and skill matrices.</p>
                    </div>
                  </div>
                )}

                {reportType !== "none" && !isAnalyzing && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500 pb-12">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-display font-bold mb-1 md:mb-2 text-balance">Analysis Report</h2>
                        <p className="text-sm text-muted-foreground">
                          {reportType === "match" ? "Resume Audit & Job Match" : "Comprehensive Resume Audit"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-white flex-1 md:flex-none">Export PDF</Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Score Card */}
                      <Card className="lg:col-span-1 border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 blur-2xl"></div>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Overall Resume Score</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6">
                          <div className="relative flex items-center justify-center w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                              <circle cx="18" cy="18" r="16" fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - resumeReport.score} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-4xl font-bold font-display">{resumeReport.score}</span>
                              <span className="text-xs text-muted-foreground">/ 100</span>
                            </div>
                          </div>
                          <Badge variant={resumeReport.score > 80 ? "default" : "secondary"} className="mt-6">
                            {resumeReport.score > 80 ? 'Excellent' : 'Needs Work'}
                          </Badge>
                        </CardContent>
                      </Card>

                      {/* ATS and Formatting Summary */}
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="shadow-sm border-none bg-white">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <Bot className="w-4 h-4" /> ATS Readability
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold font-display text-green-600 mb-2">Good</div>
                            <ul className="space-y-1">
                              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Parsable fonts
                              </li>
                              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Date formatting
                              </li>
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm border-none bg-white">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" /> Formatting
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold font-display mb-2">{resumeReport.formatting.score}/100</div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resumeReport.formatting.feedback}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Job Match Section (If JD provided) */}
                    {reportType === "match" && matchReport && (
                      <Card className="border-primary/20 shadow-md shadow-primary/5 overflow-hidden">
                        <div className="bg-primary/5 border-b border-primary/10 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold font-display text-lg">Job Match Analysis</h3>
                              <p className="text-sm text-muted-foreground">Tailored for this role</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:text-right">
                            <div className="text-3xl font-bold font-display text-primary">{matchReport.matchScore}%</div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest sm:hidden">Match</div>
                            <div className="hidden sm:block text-xs uppercase font-semibold text-muted-foreground tracking-wider text-right">Match Rate</div>
                          </div>
                        </div>
                        <CardContent className="p-0">
                          <Tabs defaultValue="gaps" className="w-full">
                            <div className="px-4 md:px-6 pt-4 border-b overflow-x-auto no-scrollbar">
                              <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-4 md:gap-6 flex min-w-max">
                                <TabsTrigger value="gaps" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium">Skill Gaps</TabsTrigger>
                                <TabsTrigger value="proscons" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium">Pros & Cons</TabsTrigger>
                                <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium">Summary</TabsTrigger>
                                <TabsTrigger value="interview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium">Interview</TabsTrigger>
                              </TabsList>
                            </div>

                            <div className="p-4 md:p-6">
                              <TabsContent value="gaps" className="mt-0">
                                <div className="space-y-4">
                                  {matchReport.keywordGap.map((item: any, i: number) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2">
                                      <div className="flex items-center gap-3">
                                        {item.found ? (
                                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        <span className="font-medium text-sm md:text-base">{item.skill}</span>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-8 sm:ml-0">
                                        <Badge variant="outline" className={`text-[10px] md:text-xs ${item.importance === 'High' ? 'border-orange-200 text-orange-700 bg-orange-50' : 'bg-muted'
                                          }`}>
                                          {item.importance}
                                        </Badge>
                                        <span className="text-xs font-medium text-muted-foreground">
                                          {item.found ? 'Found' : 'Missing'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="proscons" className="mt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                  <div>
                                    <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-3 md:mb-4 text-sm md:text-base">
                                      <Check className="w-4 h-4" /> Strong Matches
                                    </h4>
                                    <ul className="space-y-2 md:space-y-3">
                                      {matchReport.pros.map((pro: string, i: number) => (
                                        <li key={i} className="text-xs md:text-sm text-muted-foreground flex gap-2">
                                          <span className="text-green-500 mt-0.5">•</span>
                                          {pro}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-3 md:mb-4 text-sm md:text-base">
                                      <AlertTriangle className="w-4 h-4" /> Improvement Areas
                                    </h4>
                                    <ul className="space-y-2 md:space-y-3">
                                      {matchReport.cons.map((con: string, i: number) => (
                                        <li key={i} className="text-xs md:text-sm text-muted-foreground flex gap-2">
                                          <span className="text-red-400 mt-0.5">•</span>
                                          {con}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="summary" className="mt-0">
                                <div className="bg-muted/30 p-4 md:p-5 rounded-xl border relative group">
                                  <Badge className="mb-3 bg-primary text-primary-foreground">Tailored Summary</Badge>
                                  <p className="text-xs md:text-sm leading-relaxed italic text-muted-foreground">"{matchReport.summarySuggestion}"</p>
                                  <div className="mt-4 flex justify-end">
                                    <Button size="sm" variant="secondary" className="h-8 text-xs">Copy</Button>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="interview" className="mt-0">
                                <div className="space-y-3 md:space-y-4">
                                  <p className="text-xs md:text-sm text-muted-foreground mb-2">Prepare for these role-specific questions:</p>
                                  {matchReport.interviewQuestions.map((q: string, i: number) => (
                                    <div key={i} className="bg-white border rounded-lg p-3 md:p-4 shadow-sm flex gap-3 md:gap-4">
                                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 text-xs">
                                        {i + 1}
                                      </div>
                                      <p className="text-xs md:text-sm font-medium pt-1 leading-snug">{q}</p>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            </div>
                          </Tabs>
                        </CardContent>
                      </Card>
                    )}

                    {/* Skills & Action Plan (Always visible after analysis) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-sm border-none bg-white">
                        <CardHeader>
                          <CardTitle className="text-lg">Skills Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Technical Skills</span>
                              <span className="text-muted-foreground">{resumeReport.skills.technical}%</span>
                            </div>
                            <Progress value={resumeReport.skills.technical} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Soft Skills</span>
                              <span className="text-muted-foreground">{resumeReport.skills.soft}%</span>
                            </div>
                            <Progress value={resumeReport.skills.soft} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Leadership</span>
                              <span className="text-muted-foreground">{resumeReport.skills.leadership}%</span>
                            </div>
                            <Progress value={resumeReport.skills.leadership} className="h-2" />
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Detected Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {resumeReport.keywords.found.map((kw: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm border-none bg-white">
                        <CardHeader>
                          <CardTitle className="text-lg">Action Plan</CardTitle>
                          <CardDescription>Steps to improve your resume immediately</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {resumeReport.actionPlan.map((action: string, i: number) => (
                              <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/40 border border-muted group hover:bg-white hover:border-primary/30 transition-colors shadow-sm">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">{action}</p>
                              </div>
                            ))}
                          </div>
                          <Button
                            className="w-full mt-6"
                            variant="default"
                            onClick={handleRewrite}
                            disabled={isRewriting}
                          >
                            {isRewriting ? (
                              <>
                                <Spinner className="w-4 h-4 mr-2 animate-spin" />
                                Processing Sections...
                              </>
                            ) : (
                              <>
                                Auto-Rewrite with AI
                                <Sparkles className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Section Rewrite Dialog */}
                    <Dialog open={isRewriteDialogOpen} onOpenChange={setIsRewriteDialogOpen}>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                        <DialogHeader className="p-6 pb-2">
                          <DialogTitle>Section-wise AI Improvements</DialogTitle>
                          <DialogDescription>
                            Review the AI suggestions for each part of your resume. Choose what to apply.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 p-6 pt-2">
                          <div className="space-y-8">
                            {rewrittenSections.map((section, idx) => (
                              <div key={idx} className="space-y-4 border rounded-xl p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-bold text-lg text-primary">{section.name}</h3>
                                  <Button size="sm" onClick={() => applySection(section.rewrittenText)}>
                                    Apply this Section
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">Original</h4>
                                    <div className="p-3 bg-white rounded border text-sm text-muted-foreground min-h-[100px] whitespace-pre-wrap">
                                      {section.originalText}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs uppercase font-bold text-primary mb-2">AI Improved</h4>
                                    <div className="p-3 bg-primary/5 rounded border border-primary/20 text-sm min-h-[100px] whitespace-pre-wrap">
                                      {section.rewrittenText}
                                    </div>
                                  </div>
                                </div>
                                {section.improvements && (
                                  <div className="pt-2">
                                    <h4 className="text-xs font-semibold mb-2">Key Changes:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {section.improvements.map((imp: string, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-white">{imp}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="p-6 border-t bg-muted/10 flex justify-between">
                          <Button variant="ghost" onClick={() => setIsRewriteDialogOpen(false)}>Close</Button>
                          <Button onClick={() => {
                            setResumeText(rewrittenSections.map(s => s.rewrittenText).join("\n\n"));
                            setIsRewriteDialogOpen(false);
                            toast({ title: "Rewrite Applied", description: "All improved sections have been applied to your resume." });
                          }}>Apply All Changes</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
