import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { GraduationCap, ArrowLeft, BookOpen, Play } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الكورسات والدروس",
  description: "تصفح الكورسات والمحاضرات المنشورة في جميع المواد الدراسية على منصة خُطى.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const supabase = await createClient();

  let subjectId: string | null = null;
  let subjectTitle: string | null = null;
  if (subject) {
    const { data: s } = await supabase
      .from("subjects")
      .select("id,title_ar")
      .eq("slug", subject)
      .eq("is_active", true)
      .single();
    if (s) {
      subjectId = s.id;
      subjectTitle = s.title_ar;
    }
  }

  let query = supabase
    .from("courses")
    .select("id,title_ar,slug,description_ar,thumbnail_url,subject_id,subjects(title_ar)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);
  if (subjectId) query = query.eq("subject_id", subjectId);
  const { data: courses } = await query;

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-3 border border-secondary/20">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{subjectTitle ? `مادة: ${subjectTitle}` : "مكتبة الكورسات المنشورة"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {subjectTitle ? `كورسات مادة ${subjectTitle}` : "جميع الكورسات والمحاضرات"}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            اختر الكورس للوصول إلى قائمة الدروس والواجبات والاختبارات التفاعلية المرفقة.
          </p>
        </div>

        {subject && (
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary transition-colors bg-surface px-3 py-2 rounded-xl border border-border"
          >
            <span>إلغاء التصفية وعرض الكل</span>
          </Link>
        )}
      </div>

      {!courses || courses.length === 0 ? (
        <EmptyState
          title="لا توجد كورسات منشورة بعد"
          description={
            subjectTitle
              ? `لم يقم المدرسون بعد بنشر كورسات في مادة ${subjectTitle}. تصفح باقي المواد أو تحقق لاحقاً.`
              : "الكورسات والمحاضرات المنشورة من المعلمين المعتمدين ستظهر هنا تلقائياً."
          }
          actionHref="/subjects"
          actionLabel="استكشف المواد الدراسية"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(
            (c: {
              id: string;
              title_ar: string;
              slug: string;
              description_ar: string | null;
              thumbnail_url: string | null;
              subjects: { title_ar: string } | { title_ar: string }[] | null;
            }) => {
              const subj = Array.isArray(c.subjects) ? c.subjects[0]?.title_ar : c.subjects?.title_ar;
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                >
                  {/* Thumbnail Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.thumbnail_url}
                        alt={c.title_ar}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 text-center">
                        <div className="absolute inset-0 bg-radial-glow opacity-50" />
                        <div className="relative flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 fill-primary" />
                          </div>
                          <span className="text-xs font-bold text-slate-300 line-clamp-1">
                            {c.title_ar}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subject Pill Badge */}
                    {subj && (
                      <div className="absolute top-3 right-3 rounded-full bg-slate-950/75 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/10 shadow-sm flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-secondary" />
                        <span>{subj}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {c.title_ar}
                      </h2>
                      {c.description_ar ? (
                        <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                          {c.description_ar}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted/60 italic">
                          كورس شامل يحتوي على محاضرات واختبارات متابعة.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                      <span>دخول الكورس ومتابعة الدروس</span>
                      <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
