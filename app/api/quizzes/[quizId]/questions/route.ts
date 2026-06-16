import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/quizzes/[quizId]/questions — List all questions for a quiz
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createClient();

    const { data: questions, error } = await supabase
      .from("questions")
      .select(
        `
        *,
        options (*)
      `
      )
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    // Sort options within each question
    if (questions) {
      questions.forEach(
        (q: { options: { order_index: number }[] }) => {
          q.options.sort(
            (a: { order_index: number }, b: { order_index: number }) =>
              a.order_index - b.order_index
          );
        }
      );
    }

    return NextResponse.json(questions || []);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/quizzes/[quizId]/questions — Add a question with options (creator only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, creator_id")
      .eq("id", quizId)
      .eq("creator_id", user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: "Quiz not found or you are not the creator." },
        { status: 403 }
      );
    }

    const { question_text, score, time_required, order_index, options } =
      await request.json();

    if (!question_text) {
      return NextResponse.json(
        { error: "Question text is required." },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required." },
        { status: 400 }
      );
    }

    // Check that exactly one option is marked correct
    const correctCount = options.filter(
      (o: { is_correct: boolean }) => o.is_correct
    ).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: "Exactly one option must be marked as correct." },
        { status: 400 }
      );
    }

    // Insert the question
    const { data: newQuestion, error: qError } = await supabase
      .from("questions")
      .insert({
        quiz_id: quizId,
        question_text,
        score: score || 10,
        time_required: time_required || 30,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (qError) throw qError;

    // Insert options
    const optionsToInsert = options.map(
      (
        opt: { option_text: string; is_correct: boolean; order_index: number },
        idx: number
      ) => ({
        question_id: newQuestion.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct || false,
        order_index: opt.order_index ?? idx,
      })
    );

    const { data: newOptions, error: optError } = await supabase
      .from("options")
      .insert(optionsToInsert)
      .select();

    if (optError) throw optError;

    return NextResponse.json(
      { ...newQuestion, options: newOptions },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
