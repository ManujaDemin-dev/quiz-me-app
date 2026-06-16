import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/quizzes/room/[roomCode] — Look up quiz by room code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        questions (
          id,
          question_text,
          score,
          time_required,
          order_index,
          options (
            id,
            option_text,
            order_index
          )
        )
      `
      )
      .eq("room_code", roomCode)
      .eq("is_published", true)
      .order("order_index", {
        referencedTable: "questions",
        ascending: true,
      })
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Quiz not found or not published." },
        { status: 404 }
      );
    }

    // Sort options and strip is_correct from public response
    if (quiz?.questions) {
      quiz.questions.forEach(
        (q: { options: { order_index: number }[] }) => {
          q.options.sort(
            (a: { order_index: number }, b: { order_index: number }) =>
              a.order_index - b.order_index
          );
        }
      );
    }

    // Get question count for display
    const questionCount = quiz.questions?.length || 0;
    const totalTime =
      quiz.questions?.reduce(
        (sum: number, q: { time_required: number }) => sum + q.time_required,
        0
      ) || 0;
    const totalScore =
      quiz.questions?.reduce(
        (sum: number, q: { score: number }) => sum + q.score,
        0
      ) || 0;

    return NextResponse.json({
      ...quiz,
      question_count: questionCount,
      total_time: totalTime,
      total_score: totalScore,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
