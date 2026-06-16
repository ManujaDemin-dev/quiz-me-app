import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/attempts/[attemptId] — Complete an attempt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { total_score, time_spent } = await request.json();

    const { data: attempt, error } = await supabase
      .from("attempts")
      .update({
        total_score: total_score || 0,
        time_spent: time_spent || 0,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(attempt);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to complete attempt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/attempts/[attemptId] — Get attempt details with answers
export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: attempt, error } = await supabase
      .from("attempts")
      .select(
        `
        *,
        attempt_answers (
          *,
          questions:question_id (
            question_text,
            score,
            options (*)
          )
        )
      `
      )
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json(attempt);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch attempt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
