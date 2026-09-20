import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createExam } from "@/app/actions/teacher-exams";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const [{ data: exams }, { data: courses }] = await Promise.all([
    supabase.from("exams").select("id,title_ar,status,duration_min,exam_questions(question_id)")
      .eq("teacher_id", teacher.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("courses").select("id,title_ar").eq("teacher_id", teacher.id).limit(50),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="الاختبارات" description="أنشئ امتحاناً ثم أضف أسئلته من البنك" />

      <form action={createExam} className="mb-8 grid gap-4 rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl md:grid-cols-4">
        <h2 className="font-black md:col-span-4">امتحان جديد</h2>
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          العنوان *
          <input name="title_ar" required className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          الكورس (اختياري)
          <select name="course_id" className={fieldCls}>
            <option value="">بدون كورس</option>
            {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title_ar}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          المدة (دقيقة)
          <input name="duration_min" type="number" min={1} defaultValue={30} dir="ltr" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          النجاح %
          <input name="pass_percent" type="number" min={0} max={100} defaultValue={50} dir="ltr" className={fieldCls} />
        </label>
        <button type="submit" className="rounded-xl bg-gradient-brand px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all md:col-span-2">إنشاء وفتح البناء</button>
      </form>

      {(exams ?? []).length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted">لا توجد امتحانات بعد.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(exams ?? []).map((e: { id: string; title_ar: string; status: string; duration_min: number; exam_questions: { question_id: string }[] }) => (
            <Link key={e.id} href={`/dashboard/teacher/exams/${e.id}`} className="group rounded-2xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold group-hover:text-primary transition">{e.title_ar}</div>
                <Badge tone={e.status === "published" ? "success" : "muted"}>{e.status}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3.5 w-3.5" /> {e.exam_questions.length} أسئلة • {e.duration_min} دقيقة
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
