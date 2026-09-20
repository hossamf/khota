"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function teacherCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!teacher) redirect("/dashboard");
  return { supabase, user, teacherId: teacher.id as string };
}

export async function createQuestion(formData: FormData) {
  const { supabase, user } = await teacherCtx();
  const subjectId = String(formData.get("subject_id") || "") || null;
  const difficulty = String(formData.get("difficulty") || "medium");
  const type = String(formData.get("type") || "mcq");
  const text = String(formData.get("question_ar") || "").trim();
  const explanation = String(formData.get("explanation_ar") || "").trim() || null;
  if (!text) throw new Error("اكتب نص السؤال");
  if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error("صعوبة غير صالحة");
  if (!["mcq", "true_false", "multi", "short"].includes(type)) throw new Error("نوع غير صالح");

  const optionsRaw = String(formData.get("options") || "").trim(); // one per line
  const correctRaw = String(formData.get("correct") || "").trim(); // 1-based indexes comma separated
  let lines = optionsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
  let correctIdx: number[];
  if (type === "true_false") {
    // خيارات تلقائية: صح / خطأ — المدرس يختار الصحيحة فقط
    lines = ["صح", "خطأ"];
    const tf = parseInt(String(formData.get("tf_correct") || "1"), 10);
    correctIdx = tf === 2 ? [1] : [0];
  } else {
    if (type !== "short" && lines.length < 2) throw new Error("أدخل خيارين على الأقل (سطر لكل خيار)");
    correctIdx = correctRaw.split(",").map((s) => parseInt(s.trim(), 10) - 1).filter((n) => Number.isInteger(n) && n >= 0 && n < lines.length);
  }
  if (type !== "short" && correctIdx.length === 0) throw new Error("حدد الإجابة الصحيحة");

  const { data: q, error } = await supabase
    .from("questions")
    .insert({
      subject_id: subjectId,
      difficulty,
      type,
      question_ar: text,
      explanation_ar: explanation,
      status: "published",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (type !== "short") {
    const rows = lines.map((opt, i) => ({
      question_id: q.id,
      option_ar: opt,
      is_correct: correctIdx.includes(i),
      order_num: i + 1,
    }));
    const { error: oErr } = await supabase.from("question_options").insert(rows);
    if (oErr) throw new Error(oErr.message);
  }
  revalidatePath("/dashboard/teacher/questions");
}

export async function deleteQuestion(questionId: string) {
  const { supabase, user } = await teacherCtx();
  await supabase.from("questions").delete().eq("id", questionId).eq("created_by", user.id);
  revalidatePath("/dashboard/teacher/questions");
}

export async function createExam(formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  const title = String(formData.get("title_ar") || "").trim();
  const courseId = String(formData.get("course_id") || "") || null;
  const duration = Number(formData.get("duration_min") || 30);
  const pass = Number(formData.get("pass_percent") || 50);
  if (!title) throw new Error("اكتب عنوان الامتحان");
  const { data, error } = await supabase
    .from("exams")
    .insert({
      course_id: courseId,
      teacher_id: teacherId,
      title_ar: title,
      duration_min: Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 30,
      pass_percent: Number.isFinite(pass) ? pass : 50,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/dashboard/teacher/exams/${data.id}`);
}

export async function setExamStatus(examId: string, status: string) {
  const { supabase, teacherId } = await teacherCtx();
  if (!["draft", "published", "archived"].includes(status)) throw new Error("حالة غير صالحة");
  const { error } = await supabase.from("exams").update({ status }).eq("id", examId).eq("teacher_id", teacherId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/exams/${examId}`);
}

export async function addQuestionToExam(examId: string, questionId: string, marks: number) {
  const { supabase, teacherId } = await teacherCtx();
  const { data: exam } = await supabase.from("exams").select("id").eq("id", examId).eq("teacher_id", teacherId).single();
  if (!exam) throw new Error("الامتحان غير موجود");
  const { data: last } = await supabase.from("exam_questions").select("order_num").eq("exam_id", examId).order("order_num", { ascending: false }).limit(1).single();
  const { error } = await supabase.from("exam_questions").upsert(
    { exam_id: examId, question_id: questionId, order_num: (last?.order_num ?? 0) + 1, marks: marks > 0 ? Math.floor(marks) : 1 },
    { onConflict: "exam_id,question_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/exams/${examId}`);
}

export async function removeQuestionFromExam(examId: string, questionId: string) {
  const { supabase, teacherId } = await teacherCtx();
  const { data: exam } = await supabase.from("exams").select("id").eq("id", examId).eq("teacher_id", teacherId).single();
  if (!exam) throw new Error("الامتحان غير موجود");
  await supabase.from("exam_questions").delete().eq("exam_id", examId).eq("question_id", questionId);
  revalidatePath(`/dashboard/teacher/exams/${examId}`);
}
