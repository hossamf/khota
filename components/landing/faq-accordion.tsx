"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "كيف تضمن منصة خُطى تجربة مشاهدة بدون إعلانات مشتتة؟",
      a: "نستخدم مشغل فيديو مخصص مربوط بالبنية السحابية للمنصة بدون تشغيل أي إعلانات منبثقة أو مقاطع فيديو مقترحة قد تشتت انتباه الطالب، مع حفظ دقيق للثانية التي توقف عندها لاستئناف المذاكرة مباشرة.",
    },
    {
      q: "هل يمكن لولي الأمر متابعة أكثر من ابن في نفس الحساب؟",
      a: "نعم بكل سهولة! تتيح بوابة ولي الأمر ربط حسابات متعددة للأبناء والاطلاع على لوحة تحكم تفصيلية لكل ابن توضح ساعات المذاكرة ونتائج الاختبارات وسجل الحضور بشكل فوري.",
    },
    {
      q: "كيف يعمل نظام التصحيح التلقائي الفوري للاختبارات؟",
      a: "بمجرد تسليم الاختبار، يقوم المحرك الذكي للمنصة برصد الإجابات وإظهار النتيجة والنسبة المئوية فوراً، مع تقديم تفسير علمي دقيق لسبب صحة أو خطأ كل إجابة لترسيخ الفهم الأكاديمي.",
    },
    {
      q: "هل المناهج الدراسية مطابقة لآخر تحديثات وزارة التربية والتعليم؟",
      a: "نعم، جميع المواد والكورسات منشورة بواسطة نخبة من كبار المعلمين المعتمدين والمتابعين لأحدث مواصفات الورقة الامتحانية ونظام الأسئلة المقالية والموضوعية.",
    },
    {
      q: "كيف يمكنني كمعلم الانضمام لمنصة خُطى ونشر كورساتي؟",
      a: "يمكنك التسجيل كمعلم عبر خيار 'حساب معلم'، وسيقوم فريق الاعتماد بمراجعة بياناتك وتفعيل استوديو المعلم المتقدم لنشر المحتوى وإدارة مجموعات الطلاب وبنوك الأسئلة فوراً.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-md overflow-hidden transition-all"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between p-5 text-right font-bold text-sm sm:text-base text-foreground transition-colors hover:text-primary cursor-pointer"
            >
              <span className="leading-snug">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 mr-3 ${
                  isOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/50 pt-3 animate-in fade-in duration-200">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
