import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 1. GET: (Keep your existing GET method here)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized session context." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const { data: attempts, error: attemptsError } = await supabase
      .from("attempts")
      .select(`
        id,
        total_score,
        completed,
        started_at,
        quizzes ( title, difficulty )
      `)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (attemptsError) throw attemptsError;

    const totalAttempts = attempts?.length || 0;
    const maxScore = totalAttempts > 0 ? Math.max(...attempts.map((h: any) => h.total_score)) : 0;
    const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((acc: number, curr: any) => acc + curr.total_score, 0) / totalAttempts) : 0;

    return NextResponse.json({
      profile,
      stats: { totalAttempts, maxScore, avgScore },
      history: attempts || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { full_name, avatar_url } = await request.json();

    // Using .upsert() makes this bulletproof against missing rows
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id, // Crucial for upsert to match on the primary key
        full_name,
        avatar_url,
        role: "user" // Fallback default if row is brand new
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error("Profile PUT Runtime Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}