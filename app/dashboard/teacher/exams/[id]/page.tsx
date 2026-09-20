import { redirect } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setExamStatus, addQuestionToExam, removeQuestionFromExam } from "@/app/actions/teacher-exams";
import { PageHeader, Badge } from "@/components/ui/ui";

export default async function ExamBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const { data: exam } = await supabase
    .from("exams")
    .select("id,title_ar,status,duration_min,pass_percent,total_marks,course_id,exam_questions(question_id,marks,order_num,questions(id,question_ar,type))")
    .eq("id", id).eq("teacher_id", teacher.id).single();
  if (!exam) redirect("/dashboard/teacher/exams");

  const { data: bank } = await supabase
    .from("questions").select("id,question_ar,type,difficulty")
    .eq("created_by", user.id).eq("status", "published")
    .order("created_at", { ascending: false }).limit(50);

  const inExam = new Set((exam.exam_questions ?? []).map((q: { question_id: string }) => q.question_id));
  const totalMarks = (exam.exam_questions ?? []).reduce((s: number, q: { marks: number }) => s + (q.marks ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title={exam.title_ar} description={`المجموع: ${totalMarks} • المدة: ${exam.duration_min} دقيقة • النجاح: ${exam.pass_percent}%`}>
        {(["draft", "published", "archived"] as const).map((s) => (
          <form key={s} action={setExamStatus.bind(null, id, s)}>
            <button disabled={exam.status === s} className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold disabled:opacity-40 hover:border-primary/50 transition">
              {s === "draft" ? "مسودة" : s === "published" ? "نشر" : "أرشفة"}
            </button>
          </form>
        ))}
      </PageHeader>
      <div className="mb-6"><Badge tone={exam.status === "published" ? "success" : "muted"}>الحالة: {exam.status}</Badge></div>

      <h2 className="mb-3 font-black">أسئلة الامتحان ({exam.exam_questions.length})</h2>
      {exam.exam_questions.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">أضف أسئلة من البنك بالأسفل.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {[...exam.exam_questions]
            .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num)
            .map((q: { question_id: string; marks: number; questions: { question_ar: string; type: string } | { question_ar: string; type: string }[] | null }) => {
              const qq = Array.isArray(q.questions) ? q.questions[0] : q.questions;
              return (
                <div key={q.question_id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 text-sm backdrop-blur-xl">
                  <div>
                    <div className="font-bold">{qq?.question_ar ?? q.question_id}</div>
                    <div className="mt-1 text-xs text-muted">{qq?.type} • {q.marks} درجات</div>
                  </div>
                  <form action={removeQuestionFromExam.bind(null, id, q.question_id)}>
                    <button className="flex items-center gap-1 text-xs font-bold text-danger hover:underline"><X className="h-3.5 w-3.5" /> إزالة</button>
                  </form>
                </div>
              );
            })}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-black">إضافة من البنك</h2>
      {(bank ?? []).filter((b: { id: string }) => !inExam.has(b.id)).length === 0 ? (
        <p className="text-sm text-muted">لا توجد أسئلة متاحة — أضف من صفحة بنك الأسئلة.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(bank ?? []).filter((b: { id: string }) => !inExam.has(b.id)).map((b: { id: string; question_ar: string; type: string; difficulty: string }) => (
            <form key={b.id} action={addQuestionToExam.bind(null, id, b.id, 1)} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 text-sm backdrop-blur-xl">
              <div>
                <div className="font-bold">{b.question_ar}</div>
                <div className="mt-1 text-xs text-muted">{b.type} • {b.difficulty}</div>
              </div>
              <button className="inline-flex items-center gap-1 rounded-xl bg-gradient-brand px-4 py-1.5 text-xs font-bold text-white shadow hover:opacity-95 transition"><Plus className="h-3.5 w-3.5" /> إضافة</button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
