"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Video,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Play,
  Award,
  BookOpen,
} from "lucide-react";

type RoleType = "student" | "teacher" | "parent" | "admin";

export function RoleTabs() {
  const [activeRole, setActiveRole] = useState<RoleType>("student");

  const rolesData = {
    student: {
      id: "student" as RoleType,
      title: "بوابة الطالب الذكية",
      badge: "تجربة تعلم من الصفر حتى التفوق",
      headline: "تعلّم بدون تشتيت، تدرّب على الامتحانات، وتتبّع خطوات نجاحك",
      description:
        "صممنا بيئة الطالب لتمنحه كل ما يحتاجه للمذاكرة الفعالة: مسارات دراسية مرتبة خطوة بخطوة، شروحات فيديو بدون إعلانات مزعجة، تصحيح تلقائي فوري بعد كل درس، وقوائم ذكية للمشاهدة لاحقاً والمفضلة.",
      features: [
        "مشاهدة مركزة بدون فواصل إعلانية أو مقاطع مقترحة مشتتة",
        "تتبع تقدم المشاهدة بالدقيقة مع ميزة استئناف الفيديو تلقائياً",
        "امتحانات تفاعلية وبنك أسئلة بتصحيح فوري وشرح أسباب الإجابة",
        "تقارير درجات واضحة وتنبيهات بمواعيد الواجبات والاختبارات",
      ],
      ctaText: "ابدأ كطالب مجاناً الآن",
      ctaHref: "/register?role=student",
      mockVisual: (
        <div className="relative rounded-3xl border border-border/80 bg-surface/90 dark:bg-slate-900/90 p-5 backdrop-blur-2xl shadow-xl">
          {/* Header of mock */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs">
                🎓
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">مسار الفيزياء — الثانوية العامة</div>
                <div className="text-[10px] text-muted">المحاضرة 4: القوة المغناطيسية وعزم الازدواج</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              88% مكتمل
            </span>
          </div>

          {/* Mini video frame */}
          <div className="relative h-40 w-full rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center overflow-hidden mb-4 border border-white/10">
            <div className="absolute inset-0 bg-radial-glow opacity-60" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform cursor-pointer">
                <Play className="h-5 w-5 fill-white translate-x-[-1px]" />
              </div>
              <span className="text-[11px] text-slate-300 font-medium">متابعة الشرح من الدقيقة 14:20</span>
            </div>
            <div className="absolute bottom-2 inset-x-3 h-1 rounded-full bg-white/20 overflow-hidden" dir="ltr">
              <div className="h-full bg-secondary" style={{ width: "65%" }} />
            </div>
          </div>

          {/* Mini quiz completed badge */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-xs font-bold text-foreground">اختبار تقييم الدرس السابق</div>
                <div className="text-[10px] text-muted">تم حل 15 من 15 سؤالاً صحيحاً</div>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">100% ممتاز</span>
          </div>
        </div>
      ),
    },
    teacher: {
      id: "teacher" as RoleType,
      title: "استوديو المعلم المتقدم",
      badge: "منصة إدارة المحتوى وبناء المجتمع",
      headline: "ارفع فيديوهاتك، أنشئ بنوك الأسئلة، وراقب نتائج طلابك باحترافية",
      description:
        "يوفر خُطى للمعلم استوديو متطور لنشر الكورسات، وربط قنوات ومقاطع YouTube بسهولة، وتصميم اختبارات تصحيح آلي مع إمكانية تصدير التقارير، والتواصل المباشر مع أولياء الأمور.",
      features: [
        "ربط مقاطع YouTube بسهولة وعرضها داخل المنصة بنظام محمي",
        "أداة متطورة لإنشاء بنوك الأسئلة وتحديد درجات كل سؤال",
        "سجل درجات حقيقي لكل طالب مع ترتيب المتفوقين في الكورس",
        "إشعارات تلقائية للطلاب عند نشر درس جديد أو موعد اختبار",
      ],
      ctaText: "انضم كمعلم معتمد الآن",
      ctaHref: "/register?role=teacher",
      mockVisual: (
        <div className="relative rounded-3xl border border-border/80 bg-surface/90 dark:bg-slate-900/90 p-5 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-white font-bold text-xs">
                👨‍🏫
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">استوديو: أ. محمد عبد الله</div>
                <div className="text-[10px] text-muted">كبير معلمي الكيمياء العضوية</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
              معلم موثق
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl border border-border bg-surface-raised/60 p-3">
              <div className="text-[10px] text-muted">الطلاب النشطون</div>
              <div className="text-xl font-black text-foreground mt-1">1,480</div>
              <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">↑ +18% هذا الأسبوع</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-raised/60 p-3">
              <div className="text-[10px] text-muted">الكورسات المنشورة</div>
              <div className="text-xl font-black text-foreground mt-1">6 كورسات</div>
              <div className="text-[9px] text-primary font-semibold mt-0.5">24 درساً تفاعلياً</div>
            </div>
          </div>

          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-secondary" />
              <div>
                <div className="text-xs font-bold text-foreground">اختبار الوحدة الثانية قيد المراجعة</div>
                <div className="text-[10px] text-muted">320 طالب خاضوا الامتحان اليوم</div>
              </div>
            </div>
            <span className="text-xs font-bold text-secondary">عرض النتائج ←</span>
          </div>
        </div>
      ),
    },
    parent: {
      id: "parent" as RoleType,
      title: "بوابة ولي الأمر التفاعلية",
      badge: "اطمئنان تام ومتابعة حقيقية",
      headline: "تابع مستوى أبنائك الدراسي لحظة بلحظة وبكل سهولة ومصداقية",
      description:
        "بدون الحاجة لسؤال الابن يومياً: خُطى ترسل لك إشعارات حية بكل اختبار يخوضه، وتوضح لك الوقت الحقيقي الذي قضاه في مشاهدة الدروس، ونقاط القوة والضعف في كل مادة.",
      features: [
        "ربط حسابات أكثر من ابن في لوحة تحكم واحدة بضغطة زر",
        "إشعارات فورية عبر المنصة فور اعتماد نتيجة أي اختبار",
        "مراقبة الوقت الفعلي المخصص للمذاكرة اليومية والأسبوعية",
        "تواصل مباشر مع معلمي المادة للاستفسارات والملاحظات",
      ],
      ctaText: "سجل حساب ولي أمر مجاناً",
      ctaHref: "/register?role=parent",
      mockVisual: (
        <div className="relative rounded-3xl border border-border/80 bg-surface/90 dark:bg-slate-900/90 p-5 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white font-bold text-xs">
                👨‍👩‍👦
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">متابعة الأبناء — م. خالد الشامي</div>
                <div className="text-[10px] text-muted">الطالب: عمر خالد (3 ثانوي عام)</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              حساب مرتبط
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised/50 p-3.5 mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-foreground">نشاط المذاكرة لهذا الأسبوع</span>
              <span className="font-bold text-primary">14.5 ساعة</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden" dir="ltr">
              <div className="h-full bg-gradient-to-r from-accent to-primary" style={{ width: "85%" }} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-border/70 bg-surface p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>اختبار الرياضيات البحتة</span>
              </div>
              <span className="font-bold text-emerald-600">48 / 50 (ممتاز)</span>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>شاهد درس الكيمياء الكهربية كاملاً</span>
              </div>
              <span className="text-muted text-[11px]">اليوم 6:30 م</span>
            </div>
          </div>
        </div>
      ),
    },
    admin: {
      id: "admin" as RoleType,
      title: "منظومة الإدارة المركزية",
      badge: "حوكمة ورقابة وأمان شامل",
      headline: "إشراف كامل على كل أركان المنصة بنظام صلاحيات مشدد وتقارير فورية",
      description:
        "توفر لوحة إدارة خُطى تحكماً دقيقاً في حسابات الطلاب والمعلمين، واعتماد الكورسات والمواد، والاطلاع على سجلات الأمان والعمليات (Audit Logs) لمنع أي تلاعب.",
      features: [
        "إدارة شاملة للمستخدمين وصلاحيات الأدوار بدقة متناهية",
        "مراجعة واعتماد الكورسات والمواد قبل النشر للجمهور",
        "سجلات تدقيق كاملة (Audit Logs) لكل حركة وتعديل في النظام",
        "تقارير وإحصائيات نمو تفاعلية ودعم مراكز وسناتر التعليم",
      ],
      ctaText: "دخول بوابة الإدارة",
      ctaHref: "/dashboard/admin",
      mockVisual: (
        <div className="relative rounded-3xl border border-border/80 bg-surface/90 dark:bg-slate-900/90 p-5 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
                🛡️
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">مركز التحكم الإداري (خُطى 2.0)</div>
                <div className="text-[10px] text-muted">حالة النظام: آمن ويعمل بكفاءة 99.9%</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              صلاحية مدير
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
            <div className="rounded-xl border border-border bg-surface-raised p-2.5">
              <div className="text-[10px] text-muted">المستخدمين</div>
              <div className="text-base font-black text-foreground mt-0.5">15,420</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-2.5">
              <div className="text-[10px] text-muted">المعلمين</div>
              <div className="text-base font-black text-foreground mt-0.5">142</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-2.5">
              <div className="text-[10px] text-muted">الكورسات</div>
              <div className="text-base font-black text-foreground mt-0.5">580</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-3 text-xs">
            <div className="text-muted text-[10px] mb-2 font-bold">آخر عمليات التدقيق (Audit Logs):</div>
            <div className="flex items-center justify-between text-[11px] text-muted py-1 border-b border-border/50">
              <span>اعتماد كورس الفيزياء العامة</span>
              <span className="text-emerald-500 font-semibold">منشور</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted pt-1">
              <span>تحديث بنك أسئلة الكيمياء</span>
              <span className="text-primary font-semibold">مكتمل</span>
            </div>
          </div>
        </div>
      ),
    },
  };

  const current = rolesData[activeRole];

  return (
    <div className="w-full">
      {/* Segmented Control Pill Tabs */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-surface-raised/80 border border-border/80 backdrop-blur-md shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setActiveRole("student")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeRole === "student"
                ? "bg-gradient-brand text-white shadow-lg shadow-primary/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>الطالب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole("teacher")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeRole === "teacher"
                ? "bg-gradient-brand text-white shadow-lg shadow-primary/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>المعلم</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole("parent")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeRole === "parent"
                ? "bg-gradient-brand text-white shadow-lg shadow-primary/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ولي الأمر</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole("admin")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeRole === "admin"
                ? "bg-gradient-brand text-white shadow-lg shadow-primary/25"
                : "text-muted hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الإدارة</span>
          </button>
        </div>
      </div>

      {/* Dynamic Role Showcase Container */}
      <div className="relative rounded-3xl border border-border/80 bg-surface/75 p-6 sm:p-10 backdrop-blur-2xl shadow-xl transition-all">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          
          {/* Right Column: Narrative & Features */}
          <div className="lg:col-span-7 flex flex-col items-start text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{current.badge}</span>
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
              {current.headline}
            </h3>

            <p className="mt-3.5 text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
              {current.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 w-full">
              {current.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-surface/60 p-3 text-xs text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>

            <Link
              href={current.ctaHref}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span>{current.ctaText}</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Left Column: Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/20 via-secondary/15 to-accent/20 blur-xl opacity-60" />
            <div className="relative">
              {current.mockVisual}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
