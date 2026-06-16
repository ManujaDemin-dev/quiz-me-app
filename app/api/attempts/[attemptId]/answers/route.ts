import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/attempts/[attemptId]/answers MAIN SUBMIT O-O ...
export async function POST(
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

    // Verify the attempt belongs to this user
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .select("id, user_id, completed")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: "Attempt not found." },
        { status: 404 }
      );
    }

    if (attempt.completed) {
      return NextResponse.json(
        { error: "This attempt is already completed." },
        { status: 400 }
      );
    }

    const { question_id, selected_option_id } = await request.json();

    if (!question_id) {
      return NextResponse.json(
        { error: "question_id is required." },
        { status: 400 }
      );
    }

    // Check if this question was already answered in this attempt
    const { data: existingAnswer } = await supabase
      .from("attempt_answers")
      .select("id")
      .eq("attempt_id", attemptId)
      .eq("question_id", question_id)
      .single();

    if (existingAnswer) {
      return NextResponse.json(
        { error: "This question has already been answered." },
        { status: 400 }
      );
    }

    // Determine if the answer is correct
    let is_correct = false;
    let score_earned = 0;

    if (selected_option_id) {
      // Fetch the correct option for this question
      const { data: correctOption } = await supabase
        .from("options")
        .select("id")
        .eq("question_id", question_id)
        .eq("is_correct", true)
        .single();

      if (correctOption && correctOption.id === selected_option_id) {
        is_correct = true;
        // Fetch the question score
        const { data: question } = await supabase
          .from("questions")
          .select("score")
          .eq("id", question_id)
          .single();
        score_earned = question?.score || 0;
      }
    }

    // Insert the answer
    const { data: answer, error: answerError } = await supabase
      .from("attempt_answers")
      .insert({
        attempt_id: attemptId,
        question_id,
        selected_option_id: selected_option_id || null,
        is_correct,
        score_earned,
      })
      .select()
      .single();

    if (answerError) throw answerError;

    return NextResponse.json(
      {
        ...answer,
        is_correct,
        score_earned,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
