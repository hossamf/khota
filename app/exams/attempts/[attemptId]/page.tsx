import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id,score,percent,correct_count,wrong_count,skipped_count,status,submitted_at,exam_id,student_id,exams(title_ar,pass_percent),students!inner(profile_id)")
    .eq("id", attemptId)
    .single();
  const att = attempt as unknown as {
    id: string; score: number; percent: number;
    correct_count: number; wrong_count: number; skipped_count: number;
    status: string; exam_id: string;
    exams: { title_ar: string; pass_percent: number } | { title_ar: string; pass_percent: number }[] | null;
    students: { profile_id: string };
  } | null;
  if (!att || att.students.profile_id !== user.id) redirect("/exams");
  if (att.status !== "graded") redirect(`/exams/${att.exam_id}`);

  const ex = Array.isArray(att.exams) ? att.exams[0] : att.exams;
  const passed = att.percent >= (ex?.pass_percent ?? 50);

  const { data: answers } = await supabase
    .from("exam_answers")
    .select("is_correct,marks_awarded,answer_text,selected_option_id,questions(id,question_ar,type,explanation_ar,question_options(id,option_ar,is_correct))")
    .eq("attempt_id", attemptId);

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <h1 className="text-2xl font-black tracking-tight md:text-3xl">نتيجة: {ex?.title_ar}</h1>
      <div className={`mt-5 overflow-hidden rounded-3xl border p-6 text-center backdrop-blur-xl md:p-8 ${passed ? "border-success/40 bg-success/5" : "border-danger/40 bg-danger/5"}`}>
        <div className="text-6xl font-black" dir="ltr">{att.percent}%</div>
        <div className={`mt-2 inline-flex items-center rounded-full px-4 py-1 text-sm font-black ${passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
          {passed ? "ناجح 🎉" : "لم تجتز — راجع الدروس وحاول مجدداً"}
        </div>
        <div className="mx-auto mt-5 grid max-w-lg grid-cols-4 gap-2 text-center text-sm">
          <div className="rounded-2xl border border-border bg-surface p-3"><div className="text-xl font-black">{att.score}</div><div className="text-xs text-muted">الدرجة</div></div>
          <div className="rounded-2xl border border-border bg-surface p-3"><div className="text-xl font-black text-success">{att.correct_count}</div><div className="text-xs text-muted">صح</div></div>
          <div className="rounded-2xl border border-border bg-surface p-3"><div className="text-xl font-black text-danger">{att.wrong_count}</div><div className="text-xs text-muted">خطأ</div></div>
          <div className="rounded-2xl border border-border bg-surface p-3"><div className="text-xl font-black text-muted">{att.skipped_count}</div><div className="text-xs text-muted">متروك</div></div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-black">مراجعة الإجابات</h2>
      <div className="flex flex-col gap-3">
        {(answers ?? []).map((a: {
          is_correct: boolean | null; marks_awarded: number; answer_text: string | null; selected_option_id: string | null;
          questions: {
            question_ar: string; type: string; explanation_ar: string | null;
            question_options: { id: string; option_ar: string; is_correct: boolean }[];
          } | { question_ar: string; type: string; explanation_ar: string | null; question_options: { id: string; option_ar: string; is_correct: boolean }[] }[] | null;
        }, i: number) => {
          const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
          if (!q) return null;
          return (
            <div key={i} className="rounded-2xl border border-border/80 bg-surface/85 p-5 text-sm backdrop-blur-xl">
              <div className="font-bold">({i + 1}) {q.question_ar}</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {q.question_options.map((o) => {
                  const picked = o.id === a.selected_option_id || (a.answer_text?.includes(o.id) ?? false);
                  return (
                    <div key={o.id} className={`rounded-xl border px-3 py-2 ${o.is_correct ? "border-success/50 bg-success/10" : picked ? "border-danger/50 bg-danger/10" : "border-border"}`}>
                      {o.option_ar} {o.is_correct ? "✓" : picked ? "✗ إجابتك" : ""}
                    </div>
                  );
                })}
                {q.type === "short" ? (
                  <div className="rounded-xl bg-surface-2 border border-border px-3 py-2">إجابتك: {a.answer_text || "—"} (تصحيح يدوي لاحقاً)</div>
                ) : null}
              </div>
              {q.explanation_ar ? <div className="mt-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-muted">💡 الشرح: {q.explanation_ar}</div> : null}
            </div>
          );
        })}
      </div>
      <Link href="/exams" className="mt-6 inline-flex rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold hover:border-primary/50 transition">كل الاختبارات</Link>
    </div>
  );
}
