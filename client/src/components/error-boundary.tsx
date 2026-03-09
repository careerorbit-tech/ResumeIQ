import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center animated-gradient p-4">
                    <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center space-y-6 shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold mb-2">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                An unexpected error occurred. The error has been logged.
                            </p>
                            {this.state.error && (
                                <pre className="mt-4 text-xs bg-muted p-3 rounded-lg text-left overflow-auto max-h-32 text-muted-foreground">
                                    {this.state.error.message}
                                </pre>
                            )}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => this.setState({ hasError: false, error: null })}
                            >
                                Try Again
                            </Button>
                            <Link href="/">
                                <Button>Go Home</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
