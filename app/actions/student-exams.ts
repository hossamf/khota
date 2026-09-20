"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gradeAttempt, type GradeQuestion } from "@/lib/exams/grade";

async function studentCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!student) throw new Error("هذا الحساب ليس طالباً");
  return { supabase, studentId: student.id as string };
}

async function checkAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  exam: { id: string; course_id: string | null; teacher_id: string | null }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role === "admin") return;
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user!.id).single();
  if (teacher && teacher.id === exam.teacher_id) return;
  if (exam.course_id) {
    const { data: en } = await supabase
      .from("enrollments").select("course_id")
      .eq("student_id", studentId).eq("course_id", exam.course_id).single();
    if (!en) throw new Error("اشترك في الكورس أولاً");
  }
}

export async function startAttempt(examId: string) {
  const { supabase, studentId } = await studentCtx();
  const { data: exam } = await supabase
    .from("exams").select("id,course_id,teacher_id,status,duration_min")
    .eq("id", examId).single();
  if (!exam || exam.status !== "published") throw new Error("الامتحان غير متاح");
  await checkAccess(supabase, studentId, exam);

  const { data: existing } = await supabase
    .from("exam_attempts").select("id")
    .eq("exam_id", examId).eq("student_id", studentId).eq("status", "in_progress")
    .order("started_at", { ascending: false }).limit(1).single();
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({ exam_id: examId, student_id: studentId, status: "in_progress" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export type AnswerInput = { questionId: string; optionId?: string; multiIds?: string[]; text?: string };

export async function submitAttempt(attemptId: string, answers: AnswerInput[]) {
  const { supabase, studentId } = await studentCtx();
  const { data: attempt } = await supabase
    .from("exam_attempts").select("id,exam_id,student_id,status")
    .eq("id", attemptId).single();
  if (!attempt || attempt.student_id !== studentId) throw new Error("المحاولة غير موجودة");
  if (attempt.status !== "in_progress") return attemptId;

  const { data: eqs } = await supabase
    .from("exam_questions")
    .select("question_id,marks,questions(id,type,question_options(id,is_correct))")
    .eq("exam_id", attempt.exam_id);

  const gradeQuestions: GradeQuestion[] = (eqs ?? []).flatMap((row) => {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    if (!q) return [];
    return [
      {
        id: row.question_id,
        type: q.type,
        marks: row.marks ?? 1,
        options: ((q.question_options ?? []) as { id: string; is_correct: boolean }[]).map(
          (o) => ({ id: o.id, isCorrect: o.is_correct })
        ),
      },
    ];
  });

  const result = gradeAttempt(
    gradeQuestions,
    answers ?? []
  );

  for (const d of result.details) {
    await supabase.from("exam_answers").upsert(
      {
        attempt_id: attemptId,
        question_id: d.questionId,
        selected_option_id: d.selectedOptionId,
        answer_text: d.answerText,
        is_correct: d.status === "pending" ? null : d.status === "correct",
        marks_awarded: d.marksAwarded,
      },
      { onConflict: "attempt_id,question_id" }
    );
  }

  await supabase
    .from("exam_attempts")
    .update({
      score: result.score,
      percent: result.percent,
      correct_count: result.correct,
      wrong_count: result.wrong,
      skipped_count: result.skipped,
      status: "graded",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);
  return attemptId;
}
