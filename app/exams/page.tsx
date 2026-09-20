import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { FileCheck, Clock, HelpCircle, ArrowLeft, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بنك الاختبارات والتقييمات",
  description: "اختبر مستواك الدراسي مع تصحيح فوري وتحليل تفصيلي للإجابات على منصة خُطى.",
};

export default async function ExamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: exams } = await supabase
    .from("exams")
    .select("id,title_ar,duration_min,course_id,courses(title_ar),exam_questions(question_id)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-3 border border-accent/20">
            <FileCheck className="w-3.5 h-3.5" />
            <span>التقييم الذاتي الفوري</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            بنك الاختبارات التفاعلية
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            اختبارات مصممة لقياس فهمك لكل درس ووحدة مع تصحيح تلقائي فوري وشرح مفصل لنقاط القوة والضعف.
          </p>
        </div>
      </div>

      {!exams || exams.length === 0 ? (
        <EmptyState
          title="لا توجد اختبارات منشورة حالياً"
          description="الاختبارات الجديدة المخصصة لمساراتك ستظهر هنا فور نشرها من قبل المعلمين."
          actionHref="/courses"
          actionLabel="استكشف الكورسات المتاحة"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(exams ?? []).map(
            (e: {
              id: string;
              title_ar: string;
              duration_min: number;
              courses: { title_ar: string } | { title_ar: string }[] | null;
              exam_questions: { question_id: string }[];
            }) => {
              const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              const questionCount = e.exam_questions?.length ?? 0;
              return (
                <Link
                  key={e.id}
                  href={`/exams/${e.id}`}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {c?.title_ar ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                          <BookOpen className="w-3 h-3" />
                          <span>{c.title_ar}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted bg-surface-raised px-2.5 py-1 rounded-full border border-border">
                          اختبار شامل
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface-raised px-2.5 py-1 rounded-full border border-border">
                        <Clock className="w-3 h-3 text-secondary" />
                        <span>{e.duration_min} دقيقة</span>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {e.title_ar}
                    </h2>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <HelpCircle className="w-3.5 h-3.5 text-accent" />
                      <span>{questionCount} سؤال موضوعي</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-accent group-hover:text-primary transition-colors">
                    <span>بدء خوض الاختبار</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
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
