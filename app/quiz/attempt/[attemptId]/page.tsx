// app/quiz/attempt/[attemptId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, use, Suspense } from "react";
import Link from "next/link";

export default function QuizAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">Loading questions...</p>
        </div>
      </div>
    }>
      <QuizAttemptContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

interface Option {
  id: string;
  option_text: string;
  order_index: number;
}

interface Question {
  id: string;
  question_text: string;
  score: number;
  time_required: number;
  order_index: number;
  options: Option[];
}

interface AnswerResult {
  is_correct: boolean;
  score_earned: number;
}

type QuizPhase = "loading" | "playing" | "feedback" | "results";

function QuizAttemptContent({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { attemptId } = use(params);
  const resolvedSearchParams = use(searchParams);
  const quizId = resolvedSearchParams.quiz as string | undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: string; result: AnswerResult | null; timedOut: boolean }[]
  >([]);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quizTitle, setQuizTitle] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef(Date.now());

  // Load quiz questions
  const loadQuestions = useCallback(async () => {
    if (!quizId) {
      setError("Missing quiz reference.");
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) {
        setError("Failed to load quiz questions.");
        return;
      }
      const data = await res.json();
      setQuizTitle(data.title || "Quiz");

      if (!data.questions || data.questions.length === 0) {
        setError("This quiz has no questions.");
        return;
      }

      // Sort questions by order_index
      const sorted = data.questions.sort(
        (a: Question, b: Question) => a.order_index - b.order_index
      );
      setQuestions(sorted);
      setTimeLeft(sorted[0].time_required);
      setPhase("playing");
      questionStartTimeRef.current = Date.now();
    } catch {
      setError("Network error loading quiz.");
    }
  }, [quizId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Timer logic
  useEffect(() => {
    if (phase !== "playing" || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-submit with no answer
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex]);

  const handleTimeUp = async () => {
    const currentQ = questions[currentIndex];
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setTotalTimeSpent((prev) => prev + elapsed);

    // Submit empty answer (timed out)
    try {
      await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQ.id,
          selected_option_id: null,
        }),
      });
    } catch {
      // Continue even if submission fails
    }

    setAnswers((prev) => [
      ...prev,
      { questionId: currentQ.id, result: { is_correct: false, score_earned: 0 }, timedOut: true },
    ]);

    setLastResult({ is_correct: false, score_earned: 0 });
    setPhase("feedback");

    // Auto-advance after brief feedback
    setTimeout(() => {
      advanceToNext();
    }, 1500);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOptionId || submitting) return;
    setSubmitting(true);

    const currentQ = questions[currentIndex];
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setTotalTimeSpent((prev) => prev + elapsed);

    // Stop the timer
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQ.id,
          selected_option_id: selectedOptionId,
        }),
      });

      if (res.ok) {
        const result: AnswerResult = await res.json();
        setLastResult(result);
        if (result.is_correct) {
          setTotalScore((prev) => prev + result.score_earned);
        }
        setAnswers((prev) => [
          ...prev,
          { questionId: currentQ.id, result, timedOut: false },
        ]);
        setPhase("feedback");

        // Show feedback briefly then advance
        setTimeout(() => {
          advanceToNext();
        }, 1800);
      } else {
        alert("Failed to submit answer.");
        setPhase("playing");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const advanceToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Quiz complete
      completeAttempt();
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedOptionId(null);
    setLastResult(null);
    setTimeLeft(questions[nextIndex].time_required);
    setPhase("playing");
    questionStartTimeRef.current = Date.now();
  };

  const completeAttempt = async () => {
    setPhase("results");
    try {
      await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_score: totalScore,
          time_spent: totalTimeSpent,
        }),
      });
    } catch {
      // Results still shown even if server update fails
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  // --- RENDER STATES ---

  if (phase === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <p className="text-sm text-[#A1A1AA]">{error}</p>
          <Link href="/protected" className="text-xs text-[#61616A] hover:text-white underline underline-offset-4 transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (phase === "results") {
    const maxScore = questions.reduce((s, q) => s + q.score, 0);
    const correctCount = answers.filter((a) => a.result?.is_correct).length;
    const timedOutCount = answers.filter((a) => a.timedOut).length;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md animate-scaleIn">
          <div className="bg-[#141416] border border-white/5 rounded-3xl overflow-hidden">
            
            {/* Score Header */}
            <div className="relative px-8 pt-10 pb-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
              <div className="relative space-y-4">
                <div className="text-[10px] font-mono text-[#61616A] uppercase tracking-widest">
                  Quiz Complete
                </div>
                <h1 className="text-lg font-bold">{quizTitle}</h1>
                <div className="relative w-28 h-28 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A1E" strokeWidth="6" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={percentage >= 70 ? "#22c55e" : percentage >= 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="6"
                      strokeDasharray={`${(percentage / 100) * 264} 264`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums">{percentage}%</span>
                  </div>
                </div>
                <div className="text-3xl font-bold tabular-nums">
                  {totalScore}
                  <span className="text-sm text-[#61616A] font-normal"> / {maxScore}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 border-t border-white/5">
              <div className="px-4 py-4 text-center border-r border-white/5">
                <div className="text-lg font-bold text-emerald-400 tabular-nums">{correctCount}</div>
                <div className="text-[10px] font-mono text-[#61616A] mt-0.5">Correct</div>
              </div>
              <div className="px-4 py-4 text-center border-r border-white/5">
                <div className="text-lg font-bold text-red-400 tabular-nums">{questions.length - correctCount}</div>
                <div className="text-[10px] font-mono text-[#61616A] mt-0.5">Wrong</div>
              </div>
              <div className="px-4 py-4 text-center">
                <div className="text-lg font-bold text-amber-400 tabular-nums">{timedOutCount}</div>
                <div className="text-[10px] font-mono text-[#61616A] mt-0.5">Timed Out</div>
              </div>
            </div>

            {/* Time spent */}
            <div className="px-8 py-4 border-t border-white/5 flex justify-between items-center text-sm">
              <span className="text-[#61616A]">Time Spent</span>
              <span className="font-mono font-bold tabular-nums">
                {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s
              </span>
            </div>

            {/* Action */}
            <div className="px-8 py-6 border-t border-white/5 bg-[#0B0B0C]/50">
              <Link
                href="/protected"
                className="block w-full py-3 bg-white text-[#0B0B0C] font-bold text-sm rounded-2xl text-center hover:bg-white/90 transition active:scale-[0.98]"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING / FEEDBACK SCREEN ---
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const timerPercentage = currentQ ? (timeLeft / currentQ.time_required) * 100 : 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
        
        {/* Top Bar: Progress + Timer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#61616A]">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#61616A]">{currentQ.score} pts</span>
              <span className="text-[#61616A]">·</span>
              <span className={`font-mono font-bold tabular-nums ${isUrgent ? "text-red-400 animate-timerPulse" : "text-white"}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-[#1A1A1E] rounded-full overflow-hidden">
            <div
              className="h-full bg-white/30 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Timer Bar */}
          <div className="h-1 bg-[#1A1A1E] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 linear ${
                isUrgent ? "bg-red-500" : timerPercentage > 50 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          key={currentQ.id}
          className="bg-[#141416] border border-white/5 rounded-3xl p-8 animate-slideUp"
        >
          <p className="text-lg font-semibold leading-relaxed">{currentQ.question_text}</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            const isFeedback = phase === "feedback";
            
            // During feedback, we don't know which is correct from client
            // But we can show if user's selection was right or wrong
            let feedbackClass = "";
            if (isFeedback && isSelected) {
              feedbackClass = lastResult?.is_correct
                ? "border-emerald-500/50 bg-emerald-500/10 animate-pulseCorrect"
                : "border-red-500/50 bg-red-500/10 animate-shakeWrong";
            }

            return (
              <button
                key={opt.id}
                disabled={phase === "feedback" || submitting}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`relative flex items-center gap-4 p-4 rounded-2xl border text-left transition-all
                  ${isFeedback
                    ? feedbackClass || "border-white/5 bg-[#141416] opacity-50"
                    : isSelected
                      ? "border-white/30 bg-white/[0.06]"
                      : "border-white/5 bg-[#141416] hover:border-white/10 hover:bg-[#1A1A1E]"
                  }
                  disabled:cursor-default
                `}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border shrink-0 transition-all ${
                    isFeedback && isSelected
                      ? lastResult?.is_correct
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                      : isSelected
                        ? "bg-white text-[#0B0B0C] border-white"
                        : "bg-[#1A1A1E] text-[#61616A] border-white/5"
                  }`}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-sm">{opt.option_text}</span>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {phase === "playing" && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOptionId || submitting}
              className="px-8 py-3 bg-white text-[#0B0B0C] font-bold text-sm rounded-2xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0B0B0C]/20 border-t-[#0B0B0C] rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Answer"
              )}
            </button>
          </div>
        )}

        {/* Feedback Overlay */}
        {phase === "feedback" && (
          <div className="text-center animate-scaleIn">
            {lastResult?.is_correct ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="text-emerald-400 font-bold text-sm">✓ Correct!</span>
                <span className="text-emerald-400/60 text-xs font-mono">+{lastResult.score_earned} pts</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <span className="text-red-400 font-bold text-sm">
                  {answers[answers.length - 1]?.timedOut ? "⏰ Time's Up!" : "✕ Incorrect"}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
