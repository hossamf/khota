import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "@/app/actions/teacher";
import { PageHeader, fieldCls } from "@/components/ui/ui";

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const [{ data: subjects }, { data: grades }] = await Promise.all([
    supabase.from("subjects").select("id,title_ar").eq("is_active", true).order("order_num").limit(100),
    supabase.from("grades").select("id,title_ar").eq("is_active", true).order("order_num").limit(30),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader title="كورس جديد" description="يُنشأ كمسودة — انشره بعد إضافة المحتوى" />
      <form action={createCourse} className="grid gap-4 rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          عنوان الكورس *
          <input name="title_ar" required placeholder="مثال: الفيزياء — الميكانيكا" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          المادة
          <select name="subject_id" className={fieldCls}>
            <option value="">بدون</option>
            {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.title_ar}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          الصف
          <select name="grade_id" className={fieldCls}>
            <option value="">بدون</option>
            {(grades ?? []).map((g) => <option key={g.id} value={g.id}>{g.title_ar}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
          الوصف
          <textarea name="description_ar" rows={4} className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          السعر (0 = مجاني)
          <input name="price" type="number" min={0} defaultValue={0} dir="ltr" className={fieldCls} />
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-xl bg-gradient-brand px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
            إنشاء كمسودة
          </button>
        </div>
      </form>
    </div>
  );
}
