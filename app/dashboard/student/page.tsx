import Link from "next/link";
import { guard, signOut } from "../guard";
import {
  BookOpen,
  Play,
  Star,
  Bookmark,
  LogOut,
  Award,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default async function StudentDashboard() {
  const { supabase, user, profile } = await guard("student");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const [
    { count: enrollCount },
    { data: enrollments },
    { data: attempts },
    { data: lastProg },
    { data: favs },
    { data: wls },
  ] = await Promise.all([
    student
      ? supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", student.id)
      : Promise.resolve({ count: 0 }),
    student
      ? supabase.from("enrollments").select("course_id,progress_percent,courses(title_ar,slug)").eq("student_id", student.id).limit(6)
      : Promise.resolve({ data: [] }),
    student
      ? supabase.from("exam_attempts").select("id,percent,status").eq("student_id", student.id).order("started_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),
    student
      ? supabase.from("lesson_progress").select("lesson_id,watch_percent,updated_at,lessons(id,title_ar,course_id,courses(slug,title_ar))").eq("student_id", student.id).order("updated_at", { ascending: false }).limit(1)
      : Promise.resolve({ data: [] }),
    student
      ? supabase.from("favorites").select("lesson_id,lessons(id,title_ar,course_id,courses(slug))").eq("student_id", student.id).not("lesson_id", "is", null).limit(6)
      : Promise.resolve({ data: [] }),
    student
      ? supabase.from("watch_later").select("lesson_id,lessons(id,title_ar,course_id,courses(slug))").eq("student_id", student.id).limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  const last = (lastProg ?? [])[0] as unknown as {
    lesson_id: string;
    watch_percent: number;
    lessons: { id: string; title_ar: string; courses: { slug: string; title_ar: string } | { slug: string; title_ar: string }[] | null } | null;
  } | undefined;

  const lastCourse = last?.lessons?.courses
    ? (Array.isArray(last.lessons.courses) ? last.lessons.courses[0] : last.lessons.courses)
    : null;

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Ambient Glow */}
      <div className="absolute top-10 right-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Greeting & Header Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-surface/80 p-6 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white font-black text-xl shadow-lg shadow-primary/25">
            {profile.full_name ? profile.full_name.charAt(0) : "ط"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                مرحباً بك، {profile.full_name ?? "طالبنا المتميز"} 👋
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                حساب طالب
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              استمر في التقدم بخطوات واثقة نحو أهدافك الدراسية.
            </p>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-danger hover:border-danger/40 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>

      {/* Resume Last Watched Card (If exists) */}
      {last && lastCourse ? (
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-indigo-950/20 via-surface to-cyan-950/20 p-6 backdrop-blur-xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
                <Play className="h-5 w-5 fill-white translate-x-[-1px]" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary">استكمل مسارك التعليمي</span>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  {lastCourse.title_ar} — {last.lessons?.title_ar}
                </h3>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                  <div className="h-2 w-48 rounded-full bg-border overflow-hidden" dir="ltr">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${last.watch_percent ?? 0}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{last.watch_percent ?? 0}% مكتمل</span>
                </div>
              </div>
            </div>

            <Link
              href={`/courses/${lastCourse.slug}/lessons/${last.lesson_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all self-start md:self-auto"
            >
              <span>متابعة الدرس الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Metric Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-3 mb-10">
        <div className="rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">الكورسات المسجل بها</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-foreground">{enrollCount ?? 0}</div>
          <div className="mt-2 text-xs text-muted">
            <Link href="/courses" className="text-primary font-semibold hover:underline">
              استكشف المزيد من الكورسات ←
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">محاولات الاختبارات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-foreground">{attempts?.length ?? 0}</div>
          <div className="mt-2 text-xs text-muted">
            <Link href="/exams" className="text-secondary font-semibold hover:underline">
              خوض اختبار جديد ←
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">روابط سريعة</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-xs font-bold text-primary">
            <Link href="/subjects" className="hover:underline flex items-center gap-1">
              <span>تصفح المواد الدراسية</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
            <Link href="/courses" className="hover:underline flex items-center gap-1 text-secondary">
              <span>جميع الكورسات والدروس</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Enrolled Courses */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">كورساتي النشطة</h2>
          <Link href="/courses" className="text-xs font-bold text-primary hover:underline">
            تصفح الكورسات
          </Link>
        </div>

        {(enrollments ?? []).length === 0 ? (
          <div className="rounded-3xl border border-border/80 bg-surface/60 p-8 text-center backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">لم تشترك في أي كورس بعد</p>
            <p className="mt-1 text-xs text-muted">ابدأ باختيار مادتك وتصفح الدروس المتاحة مجاناً</p>
            <Link
              href="/subjects"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/20"
            >
              <span>تصفح المواد</span>
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(enrollments ?? []).map((e: {
              course_id: string;
              progress_percent: number;
              courses: { title_ar: string; slug: string } | { title_ar: string; slug: string }[] | null;
            }) => {
              const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              return (
                <Link
                  key={e.course_id}
                  href={c?.slug ? `/courses/${c.slug}` : "/courses"}
                  className="group rounded-2xl border border-border/80 bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {c?.title_ar ?? "كورس دراسي"}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted mb-1.5">
                    <span>نسبة الإنجاز</span>
                    <span className="font-bold text-primary">{e.progress_percent ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden" dir="ltr">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${e.progress_percent ?? 0}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Watch Later & Favorites Split */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Watch Later */}
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground">قائمة المشاهدة لاحقاً</h3>
          </div>
          {(wls ?? []).length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">لا توجد دروس في قائمة المشاهدة لاحقاً.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {((wls ?? []) as unknown as {
                lesson_id: string;
                lessons: { id: string; title_ar: string; courses: { slug: string } | { slug: string }[] | null } | null;
              }[]).map((w) => {
                const slug = w.lessons?.courses
                  ? (Array.isArray(w.lessons.courses) ? w.lessons.courses[0]?.slug : w.lessons.courses.slug)
                  : null;
                return slug ? (
                  <Link
                    key={w.lesson_id}
                    href={`/courses/${slug}/lessons/${w.lesson_id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-surface hover:border-primary/40 hover:bg-surface-raised transition-all text-xs font-semibold text-foreground"
                  >
                    <span className="line-clamp-1">{w.lessons?.title_ar ?? "درس"}</span>
                    <Play className="w-3.5 h-3.5 text-primary shrink-0 mr-2" />
                  </Link>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-bold text-foreground">المفضلة</h3>
          </div>
          {(favs ?? []).length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">لا توجد دروس في المفضلة بعد.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {((favs ?? []) as unknown as {
                lesson_id: string;
                lessons: { id: string; title_ar: string; courses: { slug: string } | { slug: string }[] | null } | null;
              }[]).map((f) => {
                const slug = f.lessons?.courses
                  ? (Array.isArray(f.lessons.courses) ? f.lessons.courses[0]?.slug : f.lessons.courses.slug)
                  : null;
                return slug ? (
                  <Link
                    key={f.lesson_id}
                    href={`/courses/${slug}/lessons/${f.lesson_id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-surface hover:border-primary/40 hover:bg-surface-raised transition-all text-xs font-semibold text-foreground"
                  >
                    <span className="line-clamp-1">{f.lessons?.title_ar ?? "درس"}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mr-2" />
                  </Link>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
