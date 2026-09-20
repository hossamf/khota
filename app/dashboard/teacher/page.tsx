import Link from "next/link";
import { Plus, Youtube, Users, ExternalLink, BadgeCheck } from "lucide-react";
import { guard, signOut } from "../guard";
import { updateTeacherProfile } from "@/app/actions/teacher";
import { PageHeader, StatCard, Badge, fieldCls } from "@/components/ui/ui";

export default async function TeacherDashboard() {
  const { supabase, user, profile } = await guard("teacher");
  const { data: teacher } = await supabase
    .from("teachers").select("id,is_verified,username,bio_ar").eq("profile_id", user.id).single();

  let courses: { id: string; title_ar: string; slug: string; status: string }[] = [];
  let studentCount = 0;
  if (teacher) {
    const { data: cs } = await supabase
      .from("courses").select("id,title_ar,slug,status")
      .eq("teacher_id", teacher.id).order("created_at", { ascending: false }).limit(20);
    courses = (cs ?? []) as typeof courses;
    const ids = courses.map((c) => c.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("enrollments").select("student_id", { count: "exact", head: true }).in("course_id", ids);
      studentCount = count ?? 0;
    }
  }

  const statusTone: Record<string, "primary" | "success" | "accent" | "muted"> = {
    published: "success",
    review: "accent",
    draft: "muted",
    archived: "muted",
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <PageHeader title={`لوحة المدرس — ${profile.full_name ?? ""}`} description="أنشئ المحتوى وتابع طلابك">
        <form action={signOut}>
          <button className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-danger/50 hover:text-danger transition">خروج</button>
        </form>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link href="/dashboard/teacher/courses/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
          <Plus className="h-4 w-4" /> كورس جديد
        </Link>
        <Link href="/dashboard/teacher/questions" className="rounded-xl border border-border bg-surface px-4 py-2.5 font-bold hover:border-primary/50 transition">بنك الأسئلة</Link>
        <Link href="/dashboard/teacher/exams" className="rounded-xl border border-border bg-surface px-4 py-2.5 font-bold hover:border-primary/50 transition">الاختبارات</Link>
        <Link href="/dashboard/teacher/youtube" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 font-bold hover:border-primary/50 transition">
          <Youtube className="h-4 w-4 text-danger" /> يوتيوب
        </Link>
        <Link href="/dashboard/teacher/students" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 font-bold hover:border-primary/50 transition">
          <Users className="h-4 w-4" /> طلابي
        </Link>
        {teacher?.username ? (
          <Link href={`/teachers/${teacher.username}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 font-bold hover:border-primary/50 transition">
            <ExternalLink className="h-4 w-4" /> صفحتي العامة
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="كورساتي" value={courses.length} tone="primary" />
        <StatCard label="طلابي (اشتراكات)" value={studentCount} tone="secondary" />
        <StatCard
          label="التحقق"
          value={teacher?.is_verified ? "موثق ✓" : "بانتظار التوثيق"}
          hint={teacher?.is_verified ? undefined : "الإدارة تراجع حسابك"}
          tone={teacher?.is_verified ? "success" : "accent"}
        />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-black">كورساتي</h2>
      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted">
          لم تنشئ أي كورس بعد. <Link href="/dashboard/teacher/courses/new" className="font-bold text-primary underline">ابدأ الأول</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} href={`/dashboard/teacher/courses/${c.id}`} className="group rounded-2xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold group-hover:text-primary transition">{c.title_ar}</div>
                <Badge tone={statusTone[c.status] ?? "muted"}>{c.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted">تحرير الوحدات والدروس والنشر ←</div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-black">الملف العام</h2>
      <form action={updateTeacherProfile} className="card-hover max-w-xl rounded-2xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          اسم المستخدم (للرابط العام /teachers/...)
          <input name="username" dir="ltr" defaultValue={teacher?.username ?? ""}
            placeholder="mohamed-physics"
            className={fieldCls} />
        </label>
        <label className="mt-3 flex flex-col gap-1.5 text-sm font-bold">
          نبذة
          <textarea name="bio_ar" rows={3} defaultValue={teacher?.bio_ar ?? ""}
            className={fieldCls} />
        </label>
        <button type="submit" className="mt-4 rounded-xl border border-border px-5 py-2 text-sm font-bold hover:border-primary/50 transition">حفظ</button>
        {teacher?.username ? (
          <span className="mr-3 inline-flex items-center gap-1 text-xs text-success"><BadgeCheck className="h-3.5 w-3.5" /> /teachers/{teacher.username}</span>
        ) : null}
      </form>
    </div>
  );
}
