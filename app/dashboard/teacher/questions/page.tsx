import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createQuestion, deleteQuestion } from "@/app/actions/teacher-exams";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";
import { Plus, Trash2 } from "lucide-react";

const typeLabel: Record<string, string> = { mcq: "اختيار واحد", true_false: "صح/خطأ", multi: "متعدد", short: "مقالي" };

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const { data: subjects } = await supabase.from("subjects").select("id,title_ar").eq("is_active", true).limit(100);
  let q = supabase.from("questions")
    .select("id,question_ar,type,difficulty,subjects(title_ar),question_options(id)")
    .eq("created_by", user.id).order("created_at", { ascending: false }).limit(50);
  if (subject) q = q.eq("subject_id", subject);
  const { data: questions } = await q;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="بنك الأسئلة" description="أسئلتك الخاصة — تُستخدم في امتحاناتك" />

      <form action={createQuestion} className="mb-8 grid gap-4 rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl md:grid-cols-2">
        <h2 className="flex items-center gap-2 font-black md:col-span-2"><Plus className="h-4 w-4 text-primary" /> سؤال جديد</h2>
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          نص السؤال *
          <textarea name="question_ar" required rows={2} className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          المادة
          <select name="subject_id" className={fieldCls}>
            <option value="">بدون</option>
            {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.title_ar}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            النوع
            <select name="type" className={fieldCls}>
              <option value="mcq">اختيار واحد</option>
              <option value="true_false">صح/خطأ (تلقائي)</option>
              <option value="multi">اختيارات متعددة</option>
              <option value="short">مقالي قصير</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            الصعوبة
            <select name="difficulty" className={fieldCls}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          الخيارات (سطر لكل خيار — للاختيار والمحدد فقط، وصح/خطأ تلقائي)
          <textarea name="options" rows={4} dir="auto" placeholder={"القاهرة\nالجيزة\nالإسكندرية"} className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          الصحيحة للاختيار (1,3)
          <input name="correct" dir="ltr" placeholder="1" className={fieldCls} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            الصحيحة لصح/خطأ
            <select name="tf_correct" className={fieldCls}>
              <option value="1">صح</option>
              <option value="2">خطأ</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            الشرح (يظهر بعد التصحيح)
            <input name="explanation_ar" className={fieldCls} />
          </label>
        </div>
        <button type="submit" className="rounded-xl bg-gradient-brand px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all md:col-span-2">حفظ السؤال</button>
      </form>

      <h2 className="mb-3 font-black">أسئلتي ({questions?.length ?? 0})</h2>
      {(questions ?? []).length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted">لم تضف أسئلة بعد.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(questions ?? []).map((x: { id: string; question_ar: string; type: string; difficulty: string; subjects: { title_ar: string } | { title_ar: string }[] | null; question_options: { id: string }[] }) => {
            const subj = Array.isArray(x.subjects) ? x.subjects[0]?.title_ar : x.subjects?.title_ar;
            return (
              <div key={x.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 text-sm backdrop-blur-xl">
                <div>
                  <div className="font-bold">{x.question_ar}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
                    <span>{subj ?? "بدون مادة"}</span>•<Badge tone="primary">{typeLabel[x.type] ?? x.type}</Badge>•<span>{x.difficulty}</span>•<span>{x.question_options.length} خيارات</span>
                  </div>
                </div>
                <form action={deleteQuestion.bind(null, x.id)}>
                  <button className="flex items-center gap-1 text-xs font-bold text-danger hover:underline"><Trash2 className="h-3.5 w-3.5" /> حذف</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
