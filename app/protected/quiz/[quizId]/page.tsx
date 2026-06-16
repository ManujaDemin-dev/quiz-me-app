// app/protected/quiz/[quizId]/page.tsx
"use client";

import { useEffect, useState, useCallback, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizManagePage({ params }: { params: Promise<{ quizId: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">Loading quiz data...</p>
        </div>
      </div>
    }>
      <QuizManageContent params={params} />
    </Suspense>
  );
}

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
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

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  room_code: string;
  is_published: boolean;
  creator_id: string;
}

function QuizManageContent({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New question form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [score, setScore] = useState(10);
  const [timeRequired, setTimeRequired] = useState(30);
  const [options, setOptions] = useState<Option[]>([
    { option_text: "", is_correct: true, order_index: 0 },
    { option_text: "", is_correct: false, order_index: 1 },
    { option_text: "", is_correct: false, order_index: 2 },
    { option_text: "", is_correct: false, order_index: 3 },
  ]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editScore, setEditScore] = useState(10);
  const [editTime, setEditTime] = useState(30);
  const [editOptions, setEditOptions] = useState<Option[]>([]);

  const loadQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) {
        setError("Quiz not found or you don't have access.");
        return;
      }
      const data = await res.json();
      setQuiz(data);
      setQuestions(data.questions || []);
    } catch {
      setError("Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const resetForm = () => {
    setQuestionText("");
    setScore(10);
    setTimeRequired(30);
    setOptions([
      { option_text: "", is_correct: true, order_index: 0 },
      { option_text: "", is_correct: false, order_index: 1 },
      { option_text: "", is_correct: false, order_index: 2 },
      { option_text: "", is_correct: false, order_index: 3 },
    ]);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const filledOptions = options.filter((o) => o.option_text.trim());
    if (filledOptions.length < 2) {
      alert("Please fill in at least 2 options.");
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      alert("Please mark one option as correct.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_text: questionText,
          score,
          time_required: timeRequired,
          order_index: questions.length,
          options: filledOptions,
        }),
      });

      if (res.ok) {
        const newQuestion = await res.json();
        setQuestions((prev) => [...prev, newQuestion]);
        resetForm();
        setShowAddForm(false);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add question.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${questionId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch {
      alert("Failed to delete.");
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.question_text);
    setEditScore(q.score);
    setEditTime(q.time_required);
    setEditOptions(
      q.options.length > 0
        ? q.options.map((o) => ({ ...o }))
        : [
            { option_text: "", is_correct: true, order_index: 0 },
            { option_text: "", is_correct: false, order_index: 1 },
            { option_text: "", is_correct: false, order_index: 2 },
            { option_text: "", is_correct: false, order_index: 3 },
          ]
    );
  };

  const handleSaveEdit = async (questionId: string) => {
    const filledOptions = editOptions.filter((o) => o.option_text.trim());
    if (filledOptions.length < 2) {
      alert("At least 2 options required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_text: editText,
            score: editScore,
            time_required: editTime,
            options: filledOptions,
          }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? updated : q))
        );
        setEditingId(null);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this quiz and all its questions?"
      )
    )
      return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/protected");
      }
    } catch {
      alert("Failed to delete quiz.");
    }
  };

  const copyRoomCode = () => {
    if (quiz?.room_code) {
      navigator.clipboard.writeText(quiz.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#61616A] font-mono">
            Loading quiz data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-red-400 text-xl">✕</span>
          </div>
          <p className="text-sm text-[#A1A1AA]">
            {error || "Quiz not found."}
          </p>
          <Link
            href="/protected"
            className="text-xs text-white/60 hover:text-white underline underline-offset-4 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Quiz Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link
            href="/protected"
            className="text-[#61616A] hover:text-white transition text-sm"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{quiz.title}</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wide border ${
                  quiz.difficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : quiz.difficulty === "Hard"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {quiz.difficulty}
              </span>
            </div>
            <p className="text-xs text-[#61616A] mt-1">
              {quiz.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteQuiz}
            className="px-3 py-2 text-[10px] font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/10 transition"
          >
            Delete Quiz
          </button>
        </div>
      </div>

      {/* Room Code & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Room Code Card */}
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#61616A] uppercase tracking-widest">
              Room Code
            </span>
            <span
              className={`text-[10px] font-mono transition-all ${
                quiz.is_published
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {quiz.is_published ? "● LIVE" : "○ DRAFT"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#0B0B0C] px-4 py-3 rounded-xl text-sm font-mono text-[#A1A1AA] select-all border border-white/5">
              {quiz.room_code}
            </code>
            <button
              onClick={copyRoomCode}
              className={`px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-[#1A1A1E] text-white border-white/5 hover:bg-[#222227]"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[10px] text-[#61616A]">
            Share this code with participants so they can join at{" "}
            <span className="text-[#A1A1AA]">/quiz/room/{quiz.room_code}</span>
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-[#141416] border border-white/5 rounded-2xl p-5 space-y-4">
          <span className="text-[10px] font-mono text-[#61616A] uppercase tracking-widest">
            Quiz Stats
          </span>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#61616A]">Questions</span>
              <span className="text-sm font-bold tabular-nums">
                {questions.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#61616A]">Total Points</span>
              <span className="text-sm font-bold tabular-nums">
                {questions.reduce((s, q) => s + q.score, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#61616A]">Total Time</span>
              <span className="text-sm font-bold tabular-nums">
                {Math.floor(
                  questions.reduce((s, q) => s + q.time_required, 0) / 60
                )}
                m{" "}
                {questions.reduce((s, q) => s + q.time_required, 0) % 60}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#61616A]">
            Questions ({questions.length})
          </h2>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) resetForm();
            }}
            className="px-4 py-2 bg-white text-[#0B0B0C] text-xs font-bold rounded-xl hover:bg-white/90 transition"
          >
            {showAddForm ? "Cancel" : "+ Add Question"}
          </button>
        </div>

        {/* Add Question Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddQuestion}
            className="bg-[#141416] border border-white/5 rounded-2xl p-6 space-y-5 animate-slideUp"
          >
            <h3 className="text-sm font-semibold text-white">
              New Question
            </h3>

            <textarea
              placeholder="Enter your question text..."
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              className="w-full bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-[#61616A] focus:outline-none focus:border-white/20 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#61616A] uppercase tracking-wider">
                  Points Value
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value) || 10)}
                  className="w-full bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#61616A] uppercase tracking-wider">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={timeRequired}
                  onChange={(e) =>
                    setTimeRequired(parseInt(e.target.value) || 30)
                  }
                  className="w-full bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono text-[#61616A] uppercase tracking-wider">
                Answer Options — Click the radio to mark the correct answer
              </label>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((prev) =>
                        prev.map((o, i) => ({
                          ...o,
                          is_correct: i === idx,
                        }))
                      )
                    }
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all shrink-0 ${
                      opt.is_correct
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-[#1A1A1E] text-[#61616A] border-white/5 hover:border-white/10"
                    }`}
                  >
                    {optionLabels[idx]}
                  </button>
                  <input
                    type="text"
                    placeholder={`Option ${optionLabels[idx]}...`}
                    value={opt.option_text}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, i) =>
                          i === idx
                            ? { ...o, option_text: e.target.value }
                            : o
                        )
                      )
                    }
                    className="flex-1 bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#61616A] focus:outline-none focus:border-white/20"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-white text-[#0B0B0C] font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 hover:bg-white/90 transition"
              >
                {saving ? "Saving..." : "Save Question"}
              </button>
            </div>
          </form>
        )}

        {/* Question List */}
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-[#141416] rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1E] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#61616A] text-xl">?</span>
            </div>
            <p className="text-sm text-[#61616A]">No questions yet.</p>
            <p className="text-xs text-[#61616A] mt-1">
              Click &quot;+ Add Question&quot; to create your first question.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-[#141416] border border-white/5 rounded-2xl p-5 animate-fadeSlideIn group hover:border-white/10 transition-all"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {editingId === q.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={1}
                        value={editScore}
                        onChange={(e) =>
                          setEditScore(parseInt(e.target.value) || 10)
                        }
                        className="bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                        placeholder="Score"
                      />
                      <input
                        type="number"
                        min={5}
                        value={editTime}
                        onChange={(e) =>
                          setEditTime(parseInt(e.target.value) || 30)
                        }
                        className="bg-[#0B0B0C] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                        placeholder="Time (s)"
                      />
                    </div>
                    <div className="space-y-2">
                      {editOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setEditOptions((prev) =>
                                prev.map((o, i) => ({
                                  ...o,
                                  is_correct: i === oIdx,
                                }))
                              )
                            }
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition shrink-0 ${
                              opt.is_correct
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-[#1A1A1E] text-[#61616A] border-white/5"
                            }`}
                          >
                            {optionLabels[oIdx]}
                          </button>
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) =>
                              setEditOptions((prev) =>
                                prev.map((o, i) =>
                                  i === oIdx
                                    ? { ...o, option_text: e.target.value }
                                    : o
                                )
                              )
                            }
                            className="flex-1 bg-[#0B0B0C] border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-xs text-[#61616A] hover:text-white transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveEdit(q.id)}
                        className="bg-white text-[#0B0B0C] font-bold text-xs px-5 py-2 rounded-xl disabled:opacity-50 hover:bg-white/90 transition"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-[10px] font-mono text-[#61616A] bg-[#1A1A1E] px-2 py-1 rounded-md mt-0.5 shrink-0">
                          Q{idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-white leading-relaxed">
                            {q.question_text}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-[10px] font-mono text-[#61616A]">
                              {q.score} pts
                            </span>
                            <span className="text-[10px] font-mono text-[#61616A]">
                              {q.time_required}s
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(q)}
                          className="p-2 text-[#61616A] hover:text-white hover:bg-[#1A1A1E] rounded-lg transition text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 text-[#61616A] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Options Preview */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                            opt.is_correct
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[#1A1A1E] text-[#A1A1AA] border border-white/5"
                          }`}
                        >
                          <span className="font-mono font-bold text-[10px]">
                            {optionLabels[oIdx]}
                          </span>
                          <span className="truncate">{opt.option_text}</span>
                          {opt.is_correct && (
                            <span className="ml-auto text-[10px]">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
