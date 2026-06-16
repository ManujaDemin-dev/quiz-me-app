import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/quizzes/[quizId]/questions/[questionId] — Update question & options
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Verify ownership
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .eq("creator_id", user.id)
      .single();

    if (!quiz) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { question_text, score, time_required, order_index, options } =
      await request.json();

    // Update question fields
    const updateData: Record<string, unknown> = {};
    if (question_text !== undefined) updateData.question_text = question_text;
    if (score !== undefined) updateData.score = score;
    if (time_required !== undefined) updateData.time_required = time_required;
    if (order_index !== undefined) updateData.order_index = order_index;

    if (Object.keys(updateData).length > 0) {
      const { error: qError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", questionId)
        .eq("quiz_id", quizId);

      if (qError) throw qError;
    }

    // If options are provided, replace them entirely
    if (options && Array.isArray(options)) {
      // Delete existing options
      const { error: deleteError } = await supabase
        .from("options")
        .delete()
        .eq("question_id", questionId);

      if (deleteError) throw deleteError;

      // Insert new options
      const optionsToInsert = options.map(
        (
          opt: { option_text: string; is_correct: boolean; order_index: number },
          idx: number
        ) => ({
          question_id: questionId,
          option_text: opt.option_text,
          is_correct: opt.is_correct || false,
          order_index: opt.order_index ?? idx,
        })
      );

      const { error: optError } = await supabase
        .from("options")
        .insert(optionsToInsert);

      if (optError) throw optError;
    }

    // Fetch updated question with options
    const { data: updatedQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("*, options(*)")
      .eq("id", questionId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(updatedQuestion);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/quizzes/[quizId]/questions/[questionId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { quizId, questionId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Verify ownership
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .eq("creator_id", user.id)
      .single();

    if (!quiz) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .eq("quiz_id", quizId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
