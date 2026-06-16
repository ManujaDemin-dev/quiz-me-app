import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/attempts
// just created a post req to start 
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to start a quiz." },
        { status: 401 }
      );
    }

    const { quiz_id } = await request.json();

    if (!quiz_id) {
      return NextResponse.json(
        { error: "quiz_id is required." },
        { status: 400 }
      );
    }

    // Check if the quiz exists and is published
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, is_published")
      .eq("id", quiz_id)
      .eq("is_published", true)
      .single();


    if (quizError || !quiz) {
      return NextResponse.json(
        { error: "Quiz not found or not published." },
        { status: 404 }
      );
    }

    // Check if user already has an in-progress attempt
    const { data: existingAttempt } = await supabase
      .from("attempts")
      .select("id")
      .eq("quiz_id", quiz_id)
      .eq("user_id", user.id)
      .eq("completed", false)
      .single();

    if (existingAttempt) {
      // Return the existing attempt so they can resume
      return NextResponse.json(
        { attempt_id: existingAttempt.id, resumed: true },
        { status: 200 }
      );
    }

    // Create new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .insert({
        quiz_id,
        user_id: user.id,
        total_score: 0,
        time_spent: 0,
        completed: false,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return NextResponse.json(
      { attempt_id: attempt.id, resumed: false },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to start attempt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
