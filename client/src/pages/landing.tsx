import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { SEO } from "@/components/seo";
import {
    Sparkles, BarChart2, ArrowRight, CheckCircle2, Zap, Bot,
    Shield, FileText, Target, TrendingUp, Star, Users, Clock, Award
} from "lucide-react";

const features = [
    {
        icon: Bot,
        title: "AI Resume Scoring",
        description: "Get a comprehensive score out of 100 with detailed breakdown across formatting, keywords, and impact.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
        icon: Target,
        title: "Job Match Analysis",
        description: "Paste any job description and see exactly how well your resume matches, with skill gap analysis.",
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
        icon: Shield,
        title: "ATS Compatibility",
        description: "Ensure your resume passes Applicant Tracking Systems with real-time parsing feedback.",
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
        icon: Zap,
        title: "AI Auto-Rewrite",
        description: "One click to rewrite and improve your resume using the latest AI models.",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
        icon: FileText,
        title: "PDF Export",
        description: "Export your full analysis report as a clean PDF to share with mentors or career coaches.",
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
        icon: TrendingUp,
        title: "Action Plan",
        description: "Get 4 specific, actionable next steps to immediately improve your resume's performance.",
        color: "text-teal-500",
        bg: "bg-teal-50 dark:bg-teal-950/30",
    },
];

const steps = [
    { step: "01", title: "Upload Your Resume", description: "Drag & drop your PDF or paste your resume text. We accept PDF, DOCX, and TXT formats." },
    { step: "02", title: "AI Analyzes in Seconds", description: "Advanced AI reads your resume and runs comprehensive analysis across 6 dimensions." },
    { step: "03", title: "Get Actionable Insights", description: "Receive your full report with scores, gaps, keyword analysis, and your personalized action plan." },
];

const stats = [
    { value: "6", label: "Analysis Dimensions", icon: BarChart2 },
    { value: "AI", label: "Powered by AI", icon: Bot },
    { value: "5s", label: "Average Analysis Time", icon: Clock },
    { value: "Free", label: "No Credit Card", icon: Star },
];

const landingStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ResumeIQ - Free Resume Checker",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://resume-iq.in",
    "description": "Free online resume checker. Check your resume score, ATS compatibility, keyword gaps, and get a personalized action plan. No login required.",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1250",
        "bestRating": "5"
    },
    "featureList": [
        "Free Resume Checker Online",
        "ATS Resume Score Checker",
        "Check My Resume for Free",
        "Resume Keyword Gap Analysis",
        "Job Match Score",
        "AI Resume Review",
        "Resume Optimization Tips"
    ]
};

const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ResumeIQ",
    "url": "https://resume-iq.in",
    "logo": "https://resume-iq.in/opengraph.jpg",
    "description": "AI-powered resume checker and ATS optimization tool."
};

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col">
            <SEO
                title="Free Resume Checker — ATS Resume Score | Check My Resume Online"
                description="Free resume checker online — no login required. Check your resume score, get ATS compatibility check, keyword gap analysis, and job match report. AI-powered resume review in seconds."
                keywords="free resume checker, resume checker, ATS resume checker, check my resume, resume score, free ATS checker, resume scanner, resume review free, AI resume checker, resume optimization, check resume online, resume feedback, resume grading"
                canonical="https://resume-iq.in/"
                ogImage="https://resume-iq.in/opengraph.jpg"
                structuredData={[landingStructuredData, organizationStructuredData]}
            />
            <Navbar />

            <main id="main-content">

            {/* Hero */}
            <section aria-label="Hero section" className="relative overflow-hidden animated-gradient">
                {/* Orbs */}
                <div className="orb w-96 h-96 bg-primary/20 top-[-100px] left-[-100px]" style={{ animationDelay: "0s" }} />
                <div className="orb w-72 h-72 bg-purple-400/20 top-20 right-[-60px]" style={{ animationDelay: "3s" }} />
                <div className="orb w-60 h-60 bg-blue-400/15 bottom-[-50px] left-1/3" style={{ animationDelay: "5s" }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
                    <Badge className="mb-6 gap-2 text-sm py-1.5 px-4 bg-primary/10 text-primary border-primary/20 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        Free AI Resume Checker
                    </Badge>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight mb-6 leading-[1.1]">
                        Free Resume Checker
                        <br />
                        <span className="gradient-text">ATS Score</span> &amp; Job Match
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Check your resume for free — get an ATS compatibility score, keyword gap analysis,
                        job match report, and personalized action plan. No login required, instant AI-powered results.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/analyze">
                            <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-xl shadow-primary/30 gap-2 group">
                                Analyze My Resume
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href="/history">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-base glass-card">
                                View Past Analyses
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        {["No signup required", "100% free", "Instant results"].map((item) => (
                            <span key={item} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section aria-label="Key statistics" className="border-y bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="flex justify-center mb-2">
                                    <stat.icon className="w-5 h-5 text-primary opacity-70" />
                                </div>
                                <div className="text-3xl font-display font-bold text-primary">{stat.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section aria-label="Free resume checker features" className="py-24 bg-muted/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">Features</Badge>
                        <h2 className="text-4xl font-display font-bold mb-4">
                            Free Resume Checker Features
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Everything you need to check your resume score, pass ATS, and land more interviews — all free.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <Card key={feature.title} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section aria-label="How to check your resume for free" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">How It Works</Badge>
                        <h2 className="text-4xl font-display font-bold mb-4">How to check your resume for free</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Check your resume score in 3 simple steps — no signup, no credit card, 100% free.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connector line */}
                        <div className="hidden lg:block absolute top-16 left-[calc(16.67%+60px)] right-[calc(16.67%+60px)] h-px bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {steps.map((step, i) => (
                                <div key={step.step} className="flex flex-col items-center text-center relative">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 relative z-10">
                                        {step.step}
                                    </div>
                                    <h3 className="font-display font-semibold text-xl mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section aria-label="Check your resume for free" className="py-24 bg-primary relative overflow-hidden">
                <div className="orb w-96 h-96 bg-white/10 top-[-100px] right-[-100px]" />
                <div className="orb w-64 h-64 bg-white/5 bottom-[-60px] left-1/4" style={{ animationDelay: "4s" }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Award className="w-12 h-12 text-primary-foreground/70 mx-auto mb-6" />
                    <h2 className="text-4xl sm:text-5xl font-display font-bold text-primary-foreground mb-6">
                        Check Your Resume Score — Free
                    </h2>
                    <p className="text-primary-foreground/80 text-xl mb-10 max-w-xl mx-auto">
                        Join thousands of job seekers who improved their resume score with our free ATS resume checker.
                    </p>
                    <Link href="/analyze">
                        <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-semibold gap-2 group shadow-xl">
                            Check My Resume — Free
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </section>

            </main>

            {/* Footer */}
            <footer role="contentinfo" className="border-t bg-background py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <span className="font-display font-bold text-xl tracking-tight">
                                    Resume<span className="text-primary">IQ</span>
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                                Free AI-powered resume checker with ATS compatibility scoring, job match analysis,
                                and actionable improvement tips. No login required.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-display font-semibold text-sm mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                                <li><Link href="/analyze" className="text-sm text-muted-foreground hover:text-primary transition-colors">Analyze Resume</Link></li>
                                <li><Link href="/history" className="text-sm text-muted-foreground hover:text-primary transition-colors">History</Link></li>
                            </ul>
                        </div>

                        {/* Features */}
                        <div>
                            <h3 className="font-display font-semibold text-sm mb-4">Features</h3>
                            <ul className="space-y-2">
                                <li><span className="text-sm text-muted-foreground">ATS Score Checker</span></li>
                                <li><span className="text-sm text-muted-foreground">Job Match Analysis</span></li>
                                <li><span className="text-sm text-muted-foreground">AI Resume Rewrite</span></li>
                                <li><span className="text-sm text-muted-foreground">Keyword Gap Analysis</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            &copy; {new Date().getFullYear()} ResumeIQ. Free AI-Powered Resume Analysis.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Built with AI to help job seekers land more interviews.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
