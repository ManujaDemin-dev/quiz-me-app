import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white flex flex-col items-center selection:bg-white/10">
      <div className="flex-1 w-full flex flex-col items-center">
        
        {/* Navigation Bar */}
        <nav className="w-full flex justify-center border-b border-white/5 bg-[#141416]/50 backdrop-blur-md sticky top-0 z-50 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center px-6 text-sm">
            
            <div className="flex gap-8 items-center font-semibold">
              <Link href="/protected" className="tracking-tight hover:text-white/80 transition font-bold">
                Arena Portal Hub
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Suspense fallback={<span className="text-xs font-mono text-[#61616A] animate-pulse">Loading...</span>}>
                <AuthButton />
              </Suspense>
            </div>

          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 w-full max-w-5xl px-6 py-10">
          {children}
        </div>

      </div>
    </main>
  );
}
