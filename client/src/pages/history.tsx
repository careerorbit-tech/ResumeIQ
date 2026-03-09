import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Trash2, ArrowRight, BarChart2, FileText, Calendar, Star } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
    id: string;
    timestamp: string;
    fileName: string;
    score: number;
    matchScore: number | null;
}

function ScoreBadge({ score }: { score: number }) {
    const variant = score >= 80 ? "default" : "secondary";
    const color = score >= 80 ? "bg-green-100 text-green-700 border-green-200" :
        score >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" :
            "bg-red-100 text-red-700 border-red-200";
    return (
        <Badge variant="outline" className={`font-bold text-sm px-2 py-0.5 ${color}`}>
            {score}/100
        </Badge>
    );
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("resumeiq-history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch {
                setHistory([]);
            }
        }
    }, []);

    const clearHistory = () => {
        localStorage.removeItem("resumeiq-history");
        setHistory([]);
        toast.success("History cleared");
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getScoreLabel = (score: number) =>
        score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <History className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-display font-bold">Analysis History</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Your recent resume analyses · Stored locally in your browser
                        </p>
                    </div>
                    {history.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearHistory}
                            className="gap-2 self-start sm:self-center text-destructive border-destructive/30 hover:bg-destructive/5"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Empty State */}
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                            <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-display font-semibold mb-2">No analyses yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Your past analyses will appear here after you analyze a resume.
                        </p>
                        <Link href="/analyze">
                            <Button className="gap-2">
                                Analyze a Resume
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                )}

                {/* History List */}
                {history.length > 0 && (
                    <>
                        <div className="grid gap-4">
                            {history.map((item, i) => (
                                <Card key={item.id}
                                    className="group hover:shadow-md transition-all duration-200 border hover:border-primary/30 cursor-pointer"
                                >
                                    <CardContent className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Icon + Info */}
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm truncate">{item.fileName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(item.timestamp)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Scores */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Resume Score</p>
                                                    <ScoreBadge score={item.score} />
                                                </div>
                                                {item.matchScore !== null && (
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Job Match</p>
                                                        <Badge variant="outline" className="font-bold text-sm text-blue-700 border-blue-200 bg-blue-50">
                                                            {item.matchScore}%
                                                        </Badge>
                                                    </div>
                                                )}
                                                <Badge variant="secondary" className="text-xs">
                                                    {getScoreLabel(item.score)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Summary Stats */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Analyses", value: history.length, icon: BarChart2 },
                                {
                                    label: "Avg Score", icon: Star,
                                    value: Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
                                },
                                {
                                    label: "Best Score", icon: Star,
                                    value: Math.max(...history.map(h => h.score))
                                },
                                {
                                    label: "With JD Match", icon: BarChart2,
                                    value: history.filter(h => h.matchScore !== null).length
                                },
                            ].map((stat) => (
                                <Card key={stat.label} className="border-none shadow-sm text-center">
                                    <CardContent className="p-4">
                                        <stat.icon className="w-4 h-4 text-primary mx-auto mb-2 opacity-60" />
                                        <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <Link href="/analyze">
                                <Button className="gap-2">
                                    <BarChart2 className="w-4 h-4" />
                                    Analyze Another Resume
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
