"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
} from "lucide-react";

export function ExamPreview() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(115); // 1:55

  useEffect(() => {
    if (isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswered]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const questionData = {
    title: "في تجربة البندول البسيط، عندما يمر الثقل بموضع السكون والاتزان الأصلي، فإن طاقة الحركة (Kinetic Energy) تكون:",
    subject: "الفيزياء — الصف الثالث الثانوي",
    correctIndex: 1, // Option B
    options: [
      { text: "مساوية للصفر تماماً وتنعدم السرعة", label: "أ" },
      { text: "في أقصى قيمة عظمى لها (Maximum)", label: "ب" },
      { text: "مساوية لنصف طاقة الوضع", label: "ج" },
      { text: "تعتمد فقط على كتلة الخيط ونوعه", label: "د" },
    ],
    explanation:
      "الشرح النموذجي: عند المرور بموضع السكون تكون السرعة v في أقصى قيمة لها، وبالتالي تصل طاقة الحركة KE = ½ m v² إلى قيمتها العظمى، بينما تنعدم طاقة الوضع PE تماماً وتتحول بالكامل إلى طاقة حركة.",
  };

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(115);
  };

  const isCorrect = selectedOption === questionData.correctIndex;

  return (
    <div className="relative rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-10 backdrop-blur-2xl shadow-xl">
      {/* Top Header of Simulator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تجربة حية تفاعلية</span>
            </span>
            <span className="text-xs text-muted">{questionData.subject}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1.5">
            محاكي اختبارات خُطى بتصحيح فوري
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-raised px-3 py-1.5 text-xs font-bold text-foreground border border-border" dir="ltr">
            <Clock className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span>{timeFormatted}</span>
          </div>
          {isAnswered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground active:scale-95 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة التجربة</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Box */}
      <div className="rounded-2xl border border-border/70 bg-surface-raised/50 p-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>سؤال تطبيقي:</span>
        </div>
        <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
          {questionData.title}
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        {questionData.options.map((opt, i) => {
          let stateStyle = "border-border/80 bg-surface hover:border-primary/50 hover:bg-surface-raised";

          if (isAnswered) {
            if (i === questionData.correctIndex) {
              stateStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20";
            } else if (i === selectedOption) {
              stateStyle = "border-danger bg-danger/10 text-danger font-bold ring-2 ring-danger/20";
            } else {
              stateStyle = "border-border/60 bg-surface/50 opacity-60";
            }
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`flex items-center gap-3.5 p-4 rounded-2xl border text-right transition-all duration-200 cursor-pointer disabled:cursor-default ${stateStyle}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-raised font-bold text-xs border border-border">
                {opt.label}
              </span>
              <span className="text-xs sm:text-sm leading-snug flex-1">{opt.text}</span>
              {isAnswered && i === questionData.correctIndex && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              {isAnswered && i === selectedOption && i !== questionData.correctIndex && (
                <XCircle className="w-5 h-5 text-danger shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Result & Explanation Box */}
      {isAnswered && (
        <div
          className={`rounded-2xl border p-5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
            isCorrect
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ممتاز! إجابة صحيحة في غضون ثوانٍ (+10 نقاط)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    إجابة غير دقيقة! لاحظ الشرح المفصل أدناه:
                  </span>
                </>
              )}
            </div>
            <span className="text-xs font-bold text-muted">تصحيح ذكي فوري</span>
          </div>

          <p className="text-xs sm:text-sm text-muted leading-relaxed mt-2 pt-2 border-t border-border/40">
            {questionData.explanation}
          </p>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/60">
        <span className="text-xs text-muted">
          يحتوي بنك أسئلة خُطى على أكثر من 25,000 سؤال محلول لجميع الصفوف والمواد.
        </span>
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <span>تصفح جميع اختبارات المنصة</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
