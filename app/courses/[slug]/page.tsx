import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge, PageHeader } from "@/components/ui/ui";
import { BookOpen, Lock, PlayCircle, FileCheck, ArrowLeft, Sparkles } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data: c } = await supabase
      .from("courses").select("title_ar,description_ar").eq("slug", slug).single();
    if (!c) return { title: "كورس" };
    return { title: c.title_ar, description: c.description_ar ?? undefined };
  } catch {
    return { title: "كورس" };
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from("courses")
    .select("id,title_ar,slug,description_ar,thumbnail_url,status,teacher_id,subject_id,subjects(title_ar)")
    .eq("slug", slug)
    .single();

  const full = course as {
    id: string; title_ar: string; slug: string; description_ar: string | null;
    thumbnail_url: string | null; status: string; teacher_id: string;
    subjects: { title_ar: string } | { title_ar: string }[] | null;
  } | null;

  if (!full || full.status === "archived") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <EmptyState title="الكورس غير موجود" description="تأكد من الرابط أو تصفح الكورسات المنشورة." actionHref="/courses" actionLabel="كل الكورسات" />
      </div>
    );
  }
  if (full.status !== "published") {
    // Draft/review: only owner teacher or admin can preview
    let canPreview = false;
    if (user) {
      const { data: t } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      canPreview = t?.id === full.teacher_id || p?.role === "admin";
    }
    if (!canPreview) {
      return (
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <EmptyState title="الكورس غير متاح بعد" description="هذا الكورس لم يُنشر بعد." actionHref="/courses" actionLabel="كل الكورسات" />
        </div>
      );
    }
  }
  const subj = Array.isArray(full.subjects) ? full.subjects[0]?.title_ar : full.subjects?.title_ar;

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id,title_ar,order_num,lessons(id,title_ar,order_num,duration_sec,is_free,status)")
    .eq("course_id", full.id)
    .order("order_num", { ascending: true });

  const { data: courseExams } = await supabase
    .from("exams")
    .select("id,title_ar,duration_min,exam_questions(question_id)")
    .eq("course_id", full.id)
    .eq("status", "published")
    .limit(10);

  // Enrollment + progress for logged-in students
  let enrolled = false;
  let progress = 0;
  if (user) {
    const { data: student } = await supabase
      .from("students").select("id").eq("profile_id", user.id).single();
    if (student) {
      const { data: en } = await supabase
        .from("enrollments").select("progress_percent")
        .eq("student_id", student.id).eq("course_id", full.id).single();
      if (en) {
        enrolled = true;
        progress = en.progress_percent ?? 0;
      }
    }
  }

  const firstLesson = (modules ?? [])
    .flatMap((m: { lessons: { id: string; order_num: number; status: string }[] }) =>
      (m.lessons ?? []).filter((l) => l.status === "published")
    )
    .sort((a, b) => a.order_num - b.order_num)[0];

  async function enrollAction() {
    "use server";
    const { redirect } = await import("next/navigation");
    const { enroll } = await import("@/app/actions/learning");
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: c } = await supabase.from("courses").select("id").eq("slug", slug).single();
    const courseId = c?.id;
    if (!courseId) redirect("/courses");
    try {
      await enroll(courseId);
    } catch {
      redirect("/login");
    }
    redirect(`/courses/${slug}`);
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute top-10 right-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl">
        {full.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={full.thumbnail_url} alt={full.title_ar} className="h-56 w-full object-cover md:h-72" />
        ) : (
          <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 md:h-72">
            <div className="absolute inset-0 bg-radial-glow opacity-60" />
            <BookOpen className="relative h-16 w-16 text-primary" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link href="/courses" className="inline-flex items-center gap-1 font-bold text-muted hover:text-primary">
              الكورسات <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            {subj ? <Badge tone="primary">{subj}</Badge> : null}
            {enrolled ? <Badge tone="success">مشترك ✓</Badge> : null}
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{full.title_ar}</h1>
          {full.description_ar ? <p className="mt-2 max-w-3xl text-muted">{full.description_ar}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background/60 p-4">
            {enrolled ? (
              <>
                <div className="flex-1 min-w-52">
                  <div className="mb-1.5 flex justify-between text-xs font-bold">
                    <span>تقدمك في الكورس</span>
                    <span className="text-primary" dir="ltr">{progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-border" dir="ltr">
                    <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {firstLesson ? (
                  <Link href={`/courses/${slug}/lessons/${firstLesson.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
                    <PlayCircle className="h-4 w-4" /> استكمال التعلم
                  </Link>
                ) : null}
              </>
            ) : user ? (
              <form action={enrollAction}>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
                  <Sparkles className="h-4 w-4" /> اشترك في الكورس
                </button>
              </form>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 transition-all">
                سجّل الدخول للاشتراك
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PageHeader title="محتوى الكورس" description="الدروس مرتبة من الأساس إلى الاحتراف" />
      </div>
      {!modules || modules.length === 0 ? (
        <EmptyState title="لا يوجد محتوى بعد" description="المدرس لم يضف وحدات لهذا الكورس." />
      ) : (
        <div className="flex flex-col gap-4">
          {(modules as { id: string; title_ar: string; lessons: { id: string; title_ar: string; order_num: number; duration_sec: number; is_free: boolean; status: string }[] }[]).map((m, mi) => (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-border/70 bg-surface-2/60 px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{mi + 1}</span>
                <span className="font-bold">{m.title_ar}</span>
              </div>
              <div className="flex flex-col divide-y divide-border/60">
                {(m.lessons ?? [])
                  .filter((l) => l.status === "published")
                  .sort((a, b) => a.order_num - b.order_num)
                  .map((l) => {
                    const locked = !enrolled && !l.is_free;
                    return (
                      <Link
                        key={l.id}
                        href={locked ? `/courses/${slug}` : `/courses/${slug}/lessons/${l.id}`}
                        className="group flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition hover:bg-surface-2/70"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted group-hover:border-primary/40 group-hover:text-primary transition">
                            {locked ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                          </span>
                          <span className="font-medium group-hover:text-primary transition">{l.title_ar}</span>
                        </span>
                        {l.is_free ? <Badge tone="success">مجاني</Badge> : null}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <PageHeader title="اختبارات الكورس" description="قيّم نفسك بعد كل وحدة" />
      </div>
      {!courseExams || courseExams.length === 0 ? (
        <p className="text-sm text-muted">لا توجد اختبارات في هذا الكورس بعد.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(courseExams as { id: string; title_ar: string; duration_min: number; exam_questions: { question_id: string }[] }[]).map((e) => (
            <Link key={e.id} href={enrolled ? `/exams/${e.id}` : `/courses/${slug}`}
              className="group rounded-2xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FileCheck className="h-5 w-5" />
                </span>
                <div className="font-bold group-hover:text-primary transition">{e.title_ar}</div>
              </div>
              <div className="mt-2 text-xs text-muted">{e.exam_questions.length} أسئلة • {e.duration_min} دقيقة {!enrolled ? "• اشترك للدخول" : ""}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
