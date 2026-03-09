import { Link, useLocation } from "wouter";
import { Sparkles, Moon, Sun, History, BarChart2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const [location] = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const isDark = theme === "dark";

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/analyze", label: "Analyze" },
        { href: "/history", label: "History" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex items-center gap-2.5 cursor-pointer group">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight">
                                Resume<span className="text-primary">IQ</span>
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 hidden sm:flex text-primary border-primary/30 bg-primary/5">
                                AI
                            </Badge>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={location === link.href ? "secondary" : "ghost"}
                                    size="sm"
                                    className="font-medium"
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                        </Button>

                        <Link href="/analyze">
                            <Button size="sm" className="hidden md:flex gap-2 shadow-md shadow-primary/20">
                                <BarChart2 className="w-4 h-4" />
                                Analyze Resume
                            </Button>
                        </Link>

                        {/* Mobile Menu */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-full"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 space-y-1 border-t mt-0 pt-2">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={location === link.href ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                        <Link href="/analyze">
                            <Button className="w-full mt-2 gap-2" onClick={() => setMobileOpen(false)}>
                                <BarChart2 className="w-4 h-4" />
                                Analyze Resume
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
