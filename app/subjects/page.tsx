import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen, ArrowLeft, Sparkles, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المواد الدراسية",
  description: "استكشف المواد الدراسية المتاحة في منصة خُطى وابدأ دراسة مسارك المفضل.",
};

export default async function SubjectsPage() {
  let subjects: { id: string; title_ar: string; slug: string; description_ar: string | null }[] | null = null;
  let dbMissing = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("id,title_ar,slug,description_ar")
      .eq("is_active", true)
      .order("order_num", { ascending: true })
      .limit(100);
    if (error) {
      if (error.code === "PGRST205") dbMissing = true;
      else throw error;
    } else {
      subjects = data;
    }
  } catch {
    dbMissing = true;
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div className="absolute top-10 right-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>الدليل الأكاديمي الشامل</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            المواد الدراسية
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            اختر المادة التعليمية لبدء تصفح الكورسات والمحاضرات والاختبارات التفاعلية المخصصة لكل صف دراسي.
          </p>
        </div>

        {subjects && subjects.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-muted bg-surface px-3 py-2 rounded-xl border border-border">
            <Layers className="w-4 h-4 text-primary" />
            <span>{subjects.length} مادة دراسية معتمدة</span>
          </div>
        )}
      </div>

      {dbMissing ? (
        <EmptyState
          title="قاعدة البيانات غير مهيأة بعد"
          description="يرجى تشغيل ملفات الترحيل migrations في Supabase SQL Editor لتهيئة جداول المواد."
          actionHref="/"
          actionLabel="العودة للرئيسية"
        />
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState
          title="لا توجد مواد مضافة حالياً"
          description="سيتم إدراج المواد الدراسية الرسمية قريباً من قبل إدارة المنصة."
          actionHref="/"
          actionLabel="العودة للرئيسية"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, index) => (
            <Link
              key={s.id}
              href={`/courses?subject=${s.slug}`}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/15 via-secondary/10 to-primary/5 text-primary font-black text-lg border border-primary/20 group-hover:scale-105 transition-transform">
                    {index + 1}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-1 text-[11px] font-semibold text-muted border border-border">
                    <Sparkles className="w-3 h-3 text-secondary" />
                    كورس متاح
                  </span>
                </div>

                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {s.title_ar}
                </h2>

                {s.description_ar ? (
                  <p className="mt-2.5 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                    {s.description_ar}
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs text-muted/70 italic">
                    اضغط للاطلاع على جميع الكورسات والاختبارات الخاصة بهذه المادة.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                <span>تصفح محتوى المادة</span>
                <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
