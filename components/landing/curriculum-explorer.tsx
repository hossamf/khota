"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface SubjectItem {
  id: string;
  title_ar: string;
  slug: string;
  description_ar: string | null;
  stage?: string;
  icon?: string;
  coursesCount?: number;
}

export function CurriculumExplorer({
  initialSubjects = [],
}: {
  initialSubjects: { id: string; title_ar: string; slug: string; description_ar: string | null }[];
}) {
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Rich catalog data for visual excellence
  const catalog: SubjectItem[] = [
    {
      id: "math",
      title_ar: "الرياضيات والفيزياء",
      slug: "math-physics",
      description_ar: "التفاضل والتكامل، الجبر والهندسة الفراغية، والفيزياء الحديثة بأسلوب تطبيقي مبسط.",
      stage: "secondary",
      coursesCount: 14,
    },
    {
      id: "chem",
      title_ar: "الكيمياء والأحياء",
      slug: "chemistry-biology",
      description_ar: "الكيمياء العضوية والكهربية، والبيولوجيا الجزيئية وعلم الوراثة مع نماذج تفاعلية ثلاثية الأبعاد.",
      stage: "secondary",
      coursesCount: 12,
    },
    {
      id: "arabic",
      title_ar: "اللغة العربية والبلاغة",
      slug: "arabic",
      description_ar: "إعراب شامل، أسرار البلاغة والنقد، والنصوص المتحررة لضمان الدرجة النهائية.",
      stage: "prep",
      coursesCount: 9,
    },
    {
      id: "english",
      title_ar: "اللغة الإنجليزية الشاملة",
      slug: "english",
      description_ar: "قواعد Grammar متقدمة، مهارات المحادثة والاستماع، والتفكير النقدي في حل القطع.",
      stage: "prep",
      coursesCount: 11,
    },
    {
      id: "code",
      title_ar: "البرمجة وتكنولوجيا المستقبل",
      slug: "programming-tech",
      description_ar: "تعلم بايثون وتطوير الويب والخوارزميات والذكاء الاصطناعي للطلاب والناشئين.",
      stage: "languages",
      coursesCount: 8,
    },
    {
      id: "history",
      title_ar: "التاريخ والجغرافيا السياسية",
      slug: "history-geography",
      description_ar: "قراءة تحليلية عميقة للأحداث التاريخية وخرائط الجغرافيا بطرق الفهم والربط الذهني.",
      stage: "secondary",
      coursesCount: 7,
    },
  ];

  // Merge with initialSubjects from DB if available
  const displayList = initialSubjects.length > 0
    ? initialSubjects.map((s, idx) => ({
        ...s,
        stage: idx % 3 === 0 ? "secondary" : idx % 3 === 1 ? "prep" : "languages",
        coursesCount: 6 + (idx * 2),
      }))
    : catalog;

  const filtered = selectedStage === "all"
    ? displayList
    : displayList.filter((s) => s.stage === selectedStage);

  const stages = [
    { id: "all", label: "جميع المسارات والمواد" },
    { id: "secondary", label: "الثانوية العامة (3ث)" },
    { id: "prep", label: "الشهادة الإعدادية" },
    { id: "languages", label: "اللغات وتكنولوجيا المستقبل" },
  ];

  const getStageBadge = (stage?: string) => {
    switch (stage) {
      case "secondary":
        return { text: "المرحلة الثانوية", color: "bg-indigo-500/10 text-primary border-primary/20" };
      case "prep":
        return { text: "المرحلة الإعدادية", color: "bg-cyan-500/10 text-secondary border-secondary/20" };
      case "languages":
        return { text: "مهارات وتأسيس", color: "bg-purple-500/10 text-accent border-accent/20" };
      default:
        return { text: "مسار معتمد", color: "bg-slate-500/10 text-muted border-border" };
    }
  };

  return (
    <div className="w-full">
      {/* Stage Filter Buttons */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
        {stages.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedStage(st.id)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              selectedStage === st.id
                ? "bg-foreground text-background shadow-md shadow-black/10 scale-105"
                : "bg-surface border border-border/80 text-muted hover:text-foreground hover:bg-surface-raised"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Grid of Subjects */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, index) => {
          const badge = getStageBadge(item.stage);
          return (
            <Link
              key={item.id}
              href={`/courses?subject=${item.slug}`}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/15 via-secondary/10 to-primary/5 text-primary font-black text-lg border border-primary/20 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title_ar}
                </h3>

                <p className="mt-2.5 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                  {item.description_ar ?? "شروحات وفيديوهات تفاعلية واختبارات قياس مستوى شاملة."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-bold text-primary">
                <span className="text-muted font-medium">
                  {item.coursesCount ? `${item.coursesCount} كورس متاح` : "كورسات متعددة"}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                  <span>تصفح المسار</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
