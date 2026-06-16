// app/protected/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  room_code: string;
}

export default function ProtectedDashboard() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for interactive actions
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", difficulty: "Mid" });
  const [creating, setCreating] = useState(false);

  // Fetch quizzes using our API route on mount
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await fetch("/api/quizzes");
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data);
        }
      } catch (err) {
        console.error("Failed parsing quiz feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  // Action: Handle joining via room code
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    // Redirects to a dynamic quiz room route we'll make next
    router.push(`/quiz/room/${roomCodeInput.trim()}`);
  };

  // Action: Handle submitting a new quiz structure
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuiz),
      });

      if (res.ok) {
        const createdQuiz = await res.json();
        setQuizzes((prev) => [createdQuiz, ...prev]); // Add seamlessly to view state
        setShowCreateForm(false);
        setNewQuiz({ title: "", description: "", difficulty: "Mid" });
        alert("Quiz base created successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white p-6 md:p-12 space-y-10">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Arena Portal</h1>
          <p className="text-xs text-[#61616A] mt-1">Deploy mathematical evaluation instances or test your optimal limits.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/profile" className="px-4 py-2.5 bg-[#1A1A1E] text-xs font-semibold rounded-xl border border-white/5 hover:bg-[#222227] transition">
            My Profile Settings
          </Link>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 bg-white text-[#0B0B0C] text-xs font-bold rounded-xl hover:bg-white/90 transition"
          >
            {showCreateForm ? "Close Creator" : "Create New Quiz"}
          </button>
        </div>
      </div>

      {/* Top Interactive Row: Join Room & Create Quiz Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Join Room Form */}
        <div className="bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#61616A]">Enter Room Code</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">Have a specific challenge key? Drop the UUID string here.</p>
          </div>
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input 
              type="text"
              placeholder="Paste room uuid..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="flex-1 bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white/20"
            />
            <button type="submit" className="bg-[#222227] hover:bg-[#2c2c32] px-4 py-2 rounded-xl text-xs font-semibold border border-white/5 transition">
              Join
            </button>
          </form>
        </div>

        {/* Card 2 & 3: Conditional Create Form Display */}
        {showCreateForm && (
          <form onSubmit={handleCreateQuiz} className="lg:col-span-2 bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-4 animate-fadeIn">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quiz Blueprints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Quiz Title (e.g., Data Structures)" 
                required
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
              />
              <select
                value={newQuiz.difficulty}
                onChange={(e) => setNewQuiz({ ...newQuiz, difficulty: e.target.value })}
                className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 cursor-pointer"
              >
                <option value="Easy">Easy Difficulty</option>
                <option value="Mid">Medium Difficulty</option>
                <option value="Hard">Hard Difficulty</option>
              </select>
              <input 
                type="text" 
                placeholder="Brief summary description..." 
                value={newQuiz.description}
                onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                className="md:col-span-2 bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={creating} className="bg-white text-background font-bold text-xs px-5 py-2.5 rounded-xl disabled:opacity-50">
                {creating ? "Deploying..." : "Deploy Quiz Blueprint"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Stream: Feed of Available Quizzes */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#61616A]">Available Public Arenas</h2>
        
        {loading ? (
          <div className="text-xs text-[#A1A1AA] animate-pulse">Synchronizing feed items...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-xs text-[#61616A] italic bg-[#141416] p-6 rounded-[20px] text-center border border-white/5">
            No active quizzes running right now. Deploy one above to start!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-[#141416] border border-white/5 hover:border-white/10 rounded-[20px] p-6 flex flex-col justify-between space-y-4 transition-all group">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-white group-hover:text-white/90 tracking-tight text-md line-clamp-1">{quiz.title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222227] text-[#A1A1AA] uppercase tracking-wide border border-white/5">
                      {quiz.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-2 line-clamp-2 min-h-[32px]">{quiz.description || "No layout description provided."}</p>
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="bg-[#1A1A1E] px-3 py-2 rounded-xl border border-white/5 text-[10px] font-mono flex flex-col gap-0.5">
                    <span className="text-[#61616A]">ROOM CODE KEY:</span>
                    <span className="text-[#A1A1AA] select-all truncate">{quiz.room_code}</span>
                  </div>
                  <Link 
                    href={`/quiz/room/${quiz.room_code}`}
                    className="w-full text-center block bg-[#222227] hover:bg-white hover:text-background font-semibold text-xs py-2.5 rounded-xl border border-white/5 transition-all"
                  >
                    Enter Quiz Instance &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}