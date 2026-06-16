import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-6xl flex justify-between items-center px-6 py-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Quiz Me
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 py-24 gap-12">
        <div className="max-w-3xl text-center space-y-6 animate-in fade-in duration-1000">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
            Welcome to <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">Quiz Me</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Test your knowledge with engaging quizzes. Sign in to get started and track your progress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-8 py-3 border border-border/50 rounded-lg font-semibold hover:bg-secondary transition-all duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
          <div className="p-6 bg-card border border-border/50 rounded-xl hover:border-border transition-colors duration-200 hover:shadow-glow">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold mb-2">Wide Range</h3>
            <p className="text-muted-foreground text-sm">Explore quizzes across multiple topics and difficulty levels</p>
          </div>

          <div className="p-6 bg-card border border-border/50 rounded-xl hover:border-border transition-colors duration-200 hover:shadow-glow">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
            <p className="text-muted-foreground text-sm">Monitor your scores and see your improvement over time</p>
          </div>

          <div className="p-6 bg-card border border-border/50 rounded-xl hover:border-border transition-colors duration-200 hover:shadow-glow">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Quick & Easy</h3>
            <p className="text-muted-foreground text-sm">Fast quiz completion with instant feedback and results</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-muted-foreground text-sm">
          <p>© 2024 Quiz Me App. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
