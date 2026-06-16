import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/quizzes/[quizId] — FETCH individual mcq 
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        questions (
          *,
          options (*)
        )
      `
      )
      .eq("id", quizId)
      .order("order_index", {
        referencedTable: "questions",
        ascending: true,
      })
      .single();

    if (error) throw error;

    // Sort options within each question
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

    return NextResponse.json(quiz);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/quizzes/[quizId] — Update quiz (creator only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createClient();

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

    const body = await request.json();
    const { title, description, difficulty, is_published } = body;

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(difficulty !== undefined && { difficulty }),
        ...(is_published !== undefined && { is_published }),
      })
      .eq("id", quizId)
      .eq("creator_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(quiz);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/quizzes/[quizId] — Delete quiz (creator only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const supabase = await createClient();

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

    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq("creator_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
