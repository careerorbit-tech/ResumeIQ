import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center animated-gradient p-4">
        <div className="text-center max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Big 404 */}
          <div className="relative">
            <div className="text-[10rem] font-display font-black leading-none gradient-text select-none opacity-30">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-display font-bold">Page Not Found</h1>
            <p className="text-muted-foreground leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/analyze">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" />
                Analyze Resume
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
