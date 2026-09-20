import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { LessonView, type NoteItem } from "@/components/lesson/lesson-view";
import { LessonActions } from "@/components/lesson/lesson-actions";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id,title_ar,slug,status,teacher_id")
    .eq("slug", slug)
    .single();
  if (!course) redirect("/courses");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,title_ar,type,youtube_video_id,file_url,status,is_free,course_id,module_id,order_num,course_modules(title_ar)")
    .eq("id", lessonId)
    .eq("course_id", course.id)
    .single();
  if (!lesson || lesson.status !== "published") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <EmptyState title="الدرس غير متاح" description="تأكد من الرابط." actionHref={`/courses/${slug}`} actionLabel="عودة للكورس" />
      </div>
    );
  }

  // Access: enrolled student, or free lesson, or owner teacher, or admin
  const [{ data: student }, { data: teacher }, { data: profile }] = await Promise.all([
    supabase.from("students").select("id").eq("profile_id", user.id).single(),
    supabase.from("teachers").select("id").eq("profile_id", user.id).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  const isOwner = teacher?.id === course.teacher_id || profile?.role === "admin";
  let enrolled = false;
  if (student) {
    const { data: en } = await supabase
      .from("enrollments").select("course_id")
      .eq("student_id", student.id).eq("course_id", course.id).single();
    enrolled = Boolean(en);
  }
  const canWatch =
    isOwner || (lesson as { is_free: boolean }).is_free || enrolled;
  if (!canWatch) redirect(`/courses/${slug}`);

  // Siblings for prev/next
  const { data: siblings } = await supabase
    .from("lessons")
    .select("id,title_ar,order_num")
    .eq("course_id", course.id)
    .eq("status", "published")
    .order("order_num", { ascending: true });
  const idx = (siblings ?? []).findIndex((s) => s.id === lessonId);
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = idx >= 0 && idx < (siblings?.length ?? 0) - 1 ? siblings![idx + 1] : null;

  // Progress + notes + library marks (students only; owner sees lesson without tracking)
  let position = 0;
  let completed = false;
  let notes: NoteItem[] = [];
  let isFav = false;
  let isWL = false;
  if (student) {
    const [{ data: vp }, { data: lp }, { data: ns }, { data: fav }, { data: wl }] = await Promise.all([
      supabase.from("video_progress").select("position_sec").eq("student_id", student.id).eq("lesson_id", lessonId).single(),
      supabase.from("lesson_progress").select("completed,watch_percent,last_position_sec").eq("student_id", student.id).eq("lesson_id", lessonId).single(),
      supabase.from("notes").select("id,content,timestamp_sec,created_at").eq("student_id", student.id).eq("lesson_id", lessonId).order("created_at", { ascending: false }).limit(20),
      supabase.from("favorites").select("id").eq("student_id", student.id).eq("lesson_id", lessonId).limit(1).single(),
      supabase.from("watch_later").select("lesson_id").eq("student_id", student.id).eq("lesson_id", lessonId).single(),
    ]);
    position = vp?.position_sec ?? lp?.last_position_sec ?? 0;
    completed = lp?.completed ?? false;
    notes = (ns ?? []) as NoteItem[];
    isFav = Boolean(fav);
    isWL = Boolean(wl);
  }

  const modTitle = Array.isArray(lesson.course_modules)
    ? lesson.course_modules[0]?.title_ar
    : (lesson.course_modules as { title_ar: string } | null)?.title_ar;

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1 font-bold text-muted hover:text-primary">
          {course.title_ar} <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        {modTitle ? <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-muted">{modTitle}</span> : null}
      </div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{lesson.title_ar}</h1>
        <LessonActions lessonId={lessonId} initialFav={isFav} initialWL={isWL} />
      </div>
      <LessonView
        lessonId={lessonId}
        videoId={lesson.type === "youtube" ? lesson.youtube_video_id : null}
        initialPosition={position}
        initialCompleted={completed}
        initialNotes={notes}
      />
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        {prev ? (
          <Link href={`/courses/${slug}/lessons/${prev.id}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold hover:border-primary/50 transition">
            السابق: {prev.title_ar}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/courses/${slug}/lessons/${next.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 transition">
            التالي: {next.title_ar} <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
