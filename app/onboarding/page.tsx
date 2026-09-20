import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, fieldCls } from "@/components/ui/ui";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user.id;

  const [{ data: profile, error: profErr }, { data: grades }, { data: tracks }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("id,role,full_name,grade_id").eq("id", userId).single(),
    supabase.from("grades").select("id,title_ar").eq("is_active", true).order("order_num"),
    supabase.from("tracks").select("id,title_ar").eq("is_active", true),
    supabase.from("subjects").select("id,title_ar").eq("is_active", true).order("order_num").limit(50),
  ]);

  if (profErr && !profile) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="mb-4 text-2xl font-bold">تعذر قراءة حسابك</h1>
        <div className="rounded-lg border border-danger/40 bg-surface p-5 text-sm">
          <div className="font-bold">خطأ قاعدة البيانات:</div>
          <p dir="ltr" className="mt-1 text-muted">{profErr.message}</p>
          <p className="mt-3">انسخ الرسالة وابعتها، أو اخرج وادخل مجدداً.</p>
        </div>
      </div>
    );
  }

  async function save(formData: FormData) {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const { redirect } = await import("next/navigation");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) redirect("/login");

    const fullName = String(formData.get("full_name") || "");
    const gradeId = String(formData.get("grade_id") || "") || null;
    const trackId = String(formData.get("track_id") || "") || null;

    const { data: prof } = await supabase
      .from("profiles").select("role").eq("id", userId).single();
    const role = prof?.role ?? "student";

    await supabase.from("profiles").update({
      full_name: fullName || null,
      grade_id: gradeId,
    }).eq("id", userId);

    if (role === "student") {
      await supabase.from("students").update({
        grade_id: gradeId,
        track_id: trackId,
      }).eq("profile_id", userId);
    }

    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <PageHeader title="أهلا بك 👋" description={`أكمل بياناتك من القوائم الحقيقية (الدور الحالي: ${profile?.role ?? "—"}).`} />
      <form action={save} className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          الاسم الكامل
          <input name="full_name" defaultValue={profile?.full_name ?? ""}
            className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          الصف الدراسي
          <select name="grade_id" defaultValue={profile?.grade_id ?? ""}
            className={fieldCls}>
            <option value="">اختر الصف</option>
            {(grades ?? []).map((g) => (
              <option key={g.id} value={g.id}>{g.title_ar}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          المسار (للطلاب)
          <select name="track_id"
            className={fieldCls}>
            <option value="">اختر المسار</option>
            {(tracks ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.title_ar}</option>
            ))}
          </select>
        </label>
        {(subjects ?? []).length > 0 ? (
          <p className="text-xs leading-relaxed text-muted">
            المواد المتاحة: {(subjects ?? []).map((s) => s.title_ar).join("، ")}
          </p>
        ) : (
          <p className="text-xs text-muted">لا توجد مواد مضافة بعد — ستظهر هنا فور إضافتها.</p>
        )}
        <button type="submit" className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
          حفظ ومتابعة
        </button>
      </form>
    </div>
  );
}
