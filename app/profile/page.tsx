"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProfileData {
  profile: {
    full_name: string;
    avatar_url: string;
    role: string;
  } | null;
  stats: {
    totalAttempts: number;
    maxScore: number;
    avgScore: number;
  };
  history: any[];
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Interactive Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchDashboardMetrics() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const parsedData = await res.json();
        setData(parsedData);
        // Initialize inputs with current data if available
        setFullNameInput(parsedData.profile?.full_name || "");
        setAvatarUrlInput(parsedData.profile?.avatar_url || "");
      }
    } catch (err) {
      console.error("Runtime fetch parsing error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullNameInput,
          avatar_url: avatarUrlInput,
        }),
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setData((prev) => prev ? { ...prev, profile: updatedProfile } : null);
        setIsEditing(false);
      } else {
        alert("Failed saving updated credentials.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center text-xs text-[#61616A] tracking-widest font-mono animate-pulse">
        SYNCHRONIZING PERFORMANCE ANALYTICS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white p-6 md:p-12 space-y-10">
      
      {/* Upper Navigation Row Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#1A1A1E] border border-white/10 flex items-center justify-center font-bold text-sm tracking-widest text-white uppercase font-mono overflow-hidden">
            {avatarUrlInput ? (
              <img src={data?.profile?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              data?.profile?.full_name?.substring(0, 2) || "??"
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{data?.profile?.full_name || "Arena Challenger"}</h1>
            <p className="text-xs text-[#61616A] font-mono uppercase tracking-wide mt-0.5">{data?.profile?.role || "user"} Node Access</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex-1 sm:flex-none text-center bg-[#141416] hover:bg-[#1A1A1E] border border-white/5 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            {isEditing ? "Cancel Modification" : "Modify Credentials"}
          </button>
          <Link href="/protected" className="flex-1 sm:flex-none text-center bg-white text-[#0B0B0C] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-white/90 transition">
            &larr; Portal Hub
          </Link>
        </div>
      </div>

      {/* Conditional Modifier Panel Block */}
      {isEditing && (
        <form onSubmit={handleUpdateProfile} className="bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-sm font-semibold text-white">Update Missing Personal Metrics</h3>
            <p className="text-xs text-[#61616A] mt-0.5">Keep credentials synchronized across active evaluation tracking sequences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-[#61616A]">Identity Full Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter full identity name"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase text-[#61616A]">Avatar Image Source Uniform Resource Identifier (URL)</label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/your-photo-link"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                className="bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-white text-[#0B0B0C] text-xs font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition active:scale-95"
            >
              {saving ? "Saving Parameter Vector..." : "Commit Target Metrics"}
            </button>
          </div>
        </form>
      )}

      {/* Aggregate Metric Highlight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#61616A]">Total Arenas Attended</span>
          <div className="text-3xl font-bold tracking-tight text-white">{data?.stats.totalAttempts || 0}</div>
        </div>
        <div className="bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#61616A]">Highest Acquired Yield</span>
          <div className="text-3xl font-bold tracking-tight text-green-400">
            +{data?.stats.maxScore || 0} <span className="text-xs font-normal text-[#61616A] font-sans">pts</span>
          </div>
        </div>
        <div className="bg-[#141416] border border-white/5 rounded-[20px] p-6 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#61616A]">Average Yield Density</span>
          <div className="text-3xl font-bold tracking-tight text-blue-400">
            {data?.stats.avgScore || 0} <span className="text-xs font-normal text-[#61616A] font-sans">pts</span>
          </div>
        </div>
      </div>

      {/* Historical Run Log Streams */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#61616A]">Historical Evaluation Records</h2>
        
        {!data || data.history.length === 0 ? (
          <div className="bg-[#141416] border border-white/5 rounded-[20px] p-12 text-center text-xs text-[#61616A] italic">
            No past runtime profiles logged. Execute an active arena code to seed metrics.
          </div>
        ) : (
          <div className="bg-[#141416] border border-white/5 rounded-[20px] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#1A1A1E]/30 text-[#61616A] uppercase font-bold tracking-wider">
                    <th className="p-4">Quiz Matrix Title</th>
                    <th className="p-4">Complexity Weight</th>
                    <th className="p-4">Timestamp Logged</th>
                    <th className="p-4 text-right">Resulting Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.history.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-white/[0.01] transition-all group">
                      <td className="p-4 font-medium text-white group-hover:text-white/90">
                        {attempt.quizzes?.title || "Standalone Quiz Evaluation Instance"}
                      </td>
                      <td className="p-4">
                        <span className="bg-[#1A1A1E] text-[#A1A1AA] border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide">
                          {attempt.quizzes?.difficulty || "Mid"}
                        </span>
                      </td>
                      <td className="p-4 text-[#61616A] font-mono">
                        {new Date(attempt.started_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 text-right font-bold text-green-400 font-mono">
                        +{attempt.total_score} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}