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

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id,percent,score,status,submitted_at,students!inner(profiles!inner(full_name))")
    .eq("exam_id", id)
    .order("submitted_at", { ascending: false })
    .limit(50);
  const graded = (attempts ?? []).filter((a: { status: string }) => a.status === "graded");
  const avg = graded.length > 0
    ? Math.round(graded.reduce((s: number, a: { percent: number }) => s + (a.percent ?? 0), 0) / graded.length)
    : null;

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

      <h2 className="mb-3 mt-8 font-black">
        نتائج الطلاب ({graded.length} مصححة{avg !== null ? ` • المتوسط ${avg}%` : ""})
      </h2>
      {graded.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">لا توجد محاولات مصححة بعد.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2/60 text-right">
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">النسبة</th>
                <th className="px-4 py-3">الدرجة</th>
                <th className="px-4 py-3">التسليم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {((graded ?? []) as unknown as {
                id: string; percent: number; score: number; submitted_at: string | null;
                students: { profiles: { full_name: string | null } | { full_name: string | null }[] };
              }[]).map((a) => {
                const p = Array.isArray(a.students.profiles) ? a.students.profiles[0] : a.students.profiles;
                return (
                  <tr key={a.id} className="transition hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-bold">{p?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 font-black" dir="ltr">{a.percent}%</td>
                    <td className="px-4 py-3">{a.score}</td>
                    <td className="px-4 py-3 text-muted">{a.submitted_at ? new Date(a.submitted_at).toLocaleString("ar") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
