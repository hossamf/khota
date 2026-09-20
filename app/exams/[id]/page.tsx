import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { startAttempt } from "@/app/actions/student-exams";
import { TakeExam, type TakeQuestion } from "@/components/exams/take-exam";

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: student } = await supabase.from("students").select("id").eq("profile_id", user.id).single();
  if (!student) redirect("/dashboard");

  const { data: exam } = await supabase
    .from("exams")
    .select("id,title_ar,duration_min,pass_percent,course_id,teacher_id,status,exam_questions(order_num,marks,questions(id,question_ar,type,question_options(id,option_ar)))")
    .eq("id", id)
    .single();
  if (!exam || exam.status !== "published") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState title="الامتحان غير متاح" actionHref="/exams" actionLabel="كل الاختبارات" description="تأكد من الرابط." />
      </div>
    );
  }

  // Access: owner/admin pass; course exam requires enrollment
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  const isOwner = teacher?.id === exam.teacher_id || profile?.role === "admin";
  if (!isOwner && exam.course_id) {
    const { data: en } = await supabase.from("enrollments").select("course_id")
      .eq("student_id", student.id).eq("course_id", exam.course_id).single();
    if (!en) redirect(`/courses`);
  }

  const ordered = [...(exam.exam_questions ?? [])].sort(
    (a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num
  );
  const questions: TakeQuestion[] = ordered.map((row: {
    questions: {
      id: string; question_ar: string; type: string;
      question_options: { id: string; option_ar: string }[];
    } | { id: string; question_ar: string; type: string; question_options: { id: string; option_ar: string }[] }[] | null;
  }) => {
    const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    return {
      id: q!.id,
      text: q!.question_ar,
      type: q!.type,
      options: (q!.question_options ?? []).map((o) => ({ id: o.id, text: o.option_ar })),
    };
  }).filter((q) => q.id);

  if (questions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState title="لا توجد أسئلة بعد" description="المدرس لم يضف أسئلة لهذا الامتحان." actionHref="/exams" actionLabel="كل الاختبارات" />
      </div>
    );
  }

  let attemptId: string;
  try {
    attemptId = await startAttempt(id);
  } catch {
    redirect("/exams");
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="absolute top-10 right-10 -z-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <h1 className="text-2xl font-black tracking-tight md:text-3xl">{exam.title_ar}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">المدة: {exam.duration_min} دقيقة • النجاح: {exam.pass_percent}%</p>
      <TakeExam attemptId={attemptId} durationMin={exam.duration_min} questions={questions} />
    </div>
  );
}
