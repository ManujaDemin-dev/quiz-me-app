// app/quiz/room/[roomCode]/page.tsx
"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">Fetching room data...</p>
        </div>
      </div>
    }>
      <QuizRoomContent params={params} />
    </Suspense>
  );
}

interface QuizRoom {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  room_code: string;
  creator_id: string;
  question_count: number;
  total_time: number;
  total_score: number;
}

function QuizRoomContent({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quizzes/room/${roomCode}`);
        if (!res.ok) {
          setError("Quiz not found or not available.");
          return;
        }
        const data = await res.json();
        setQuiz(data);
      } catch {
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [roomCode]);

  const handleStartQuiz = async () => {
    if (!quiz) return;
    setStarting(true);

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quiz.id }),
      });

      if (res.status === 401) {
        // Not authenticated — redirect to login
        router.push(`/auth/login?message=${encodeURIComponent("Please sign in to start the quiz.")}&redirect=/quiz/room/${roomCode}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        router.push(`/quiz/attempt/${data.attempt_id}?quiz=${quiz.id}`);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to start quiz.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">Fetching room data...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-5 animate-fadeIn max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">Room Not Found</h2>
            <p className="text-sm text-[#A1A1AA] mt-2">{error || "This quiz room doesn't exist or has been closed."}</p>
          </div>
          <Link
            href="/protected"
            className="inline-block px-5 py-2.5 text-xs font-semibold bg-[#1A1A1E] border border-white/5 rounded-xl hover:bg-[#222227] transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalMinutes = Math.floor(quiz.total_time / 60);
  const totalSeconds = quiz.total_time % 60;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg animate-fadeSlideIn">
        {/* Room Card */}
        <div className="bg-[#141416] border border-white/5 rounded-3xl overflow-hidden">
          
          {/* Gradient Header */}
          <div className="relative px-8 pt-10 pb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-wide border ${
                    quiz.difficulty === "Easy"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : quiz.difficulty === "Hard"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {quiz.difficulty}
                </span>
                <span className="text-[10px] font-mono text-[#61616A]">
                  ROOM: {quiz.room_code.slice(0, 8)}...
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{quiz.description}</p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 border-t border-white/5">
            <div className="px-6 py-5 text-center border-r border-white/5">
              <div className="text-xl font-bold tabular-nums">{quiz.question_count}</div>
              <div className="text-[10px] font-mono text-[#61616A] mt-1 uppercase tracking-wider">Questions</div>
            </div>
            <div className="px-6 py-5 text-center border-r border-white/5">
              <div className="text-xl font-bold tabular-nums">
                {totalMinutes > 0 ? `${totalMinutes}m` : ""}{totalSeconds}s
              </div>
              <div className="text-[10px] font-mono text-[#61616A] mt-1 uppercase tracking-wider">Total Time</div>
            </div>
            <div className="px-6 py-5 text-center">
              <div className="text-xl font-bold tabular-nums">{quiz.total_score}</div>
              <div className="text-[10px] font-mono text-[#61616A] mt-1 uppercase tracking-wider">Max Score</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-8 py-6 border-t border-white/5 bg-[#0B0B0C]/50">
            <button
              onClick={handleStartQuiz}
              disabled={starting || quiz.question_count === 0}
              className="w-full py-3.5 bg-white text-[#0B0B0C] font-bold text-sm rounded-2xl hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0B0B0C]/20 border-t-[#0B0B0C] rounded-full animate-spin" />
                  Initializing...
                </span>
              ) : quiz.question_count === 0 ? (
                "No Questions Available Yet"
              ) : (
                "Start Quiz →"
              )}
            </button>
            {quiz.question_count === 0 && (
              <p className="text-[10px] text-[#61616A] text-center mt-3">
                The quiz creator hasn&apos;t added questions yet.
              </p>
            )}
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/protected"
            className="text-xs text-[#61616A] hover:text-white transition underline underline-offset-4"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
