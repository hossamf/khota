import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoleTabs } from "@/components/landing/role-tabs";
import { ExamPreview } from "@/components/landing/exam-preview";
import { CurriculumExplorer } from "@/components/landing/curriculum-explorer";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Play,
  Search,
  Star,
  Zap,
  Target,
  Flame,
  Award,
  Compass,
} from "lucide-react";

export default async function Home() {
  let subjects: { id: string; title_ar: string; slug: string; description_ar: string | null }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("subjects")
      .select("id,title_ar,slug,description_ar")
      .eq("is_active", true)
      .order("order_num", { ascending: true })
      .limit(6);
    if (data && data.length > 0) {
      subjects = data;
    }
  } catch {
    // If db error or empty, fallback subjects will display seamlessly
  }

  return (
    <div className="flex flex-1 flex-col relative overflow-hidden">
      {/* Background Atmosphere & Radial Glows */}
      <div className="absolute -top-40 right-1/4 -z-10 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-96 left-10 -z-10 w-[32rem] h-[32rem] rounded-full bg-secondary/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[60rem] right-10 -z-10 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-[120px] pointer-events-none" />

      {/* 1. Ultra Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Right Column (RTL): Typography, Search & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-right">
              {/* Animated Floating Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/80 dark:bg-slate-900/80 border border-primary/30 backdrop-blur-xl shadow-xs mb-6">
                <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping" />
                <span className="text-xs font-bold text-foreground">
                  🔥 منصة خُـطَـى 2.0 — الجيل الجديد من التعليم التفاعلي
                </span>
              </div>

              {/* Mega Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.18] sm:leading-[1.15]">
                خطوتك الأولى نحو{" "}
                <span className="text-gradient block mt-1 sm:mt-2">
                  التفوق والريادة الأكاديمية
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-lg text-muted max-w-2xl leading-relaxed">
                منظومة تعليمية متطورة صُممت خصيصاً للطلاب وأولياء الأمور والمعلمين. مسارات دراسية مرتبة، فيديوهات مركزة بدون إعلانات مشتتة، امتحانات بتصحيح فوري، ومتابعة دقيقة لكل خطوة في رحلتك.
              </p>

              {/* Hero Search Box */}
              <div className="mt-8 w-full max-w-xl">
                <form action="/courses" method="GET" className="relative flex items-center">
                  <input
                    type="text"
                    name="q"
                    placeholder="ابحث عن مادة، كورس، درس، أو مدرس..."
                    className="w-full rounded-2xl border border-border/80 bg-surface/90 dark:bg-slate-950/80 px-4 py-3.5 pr-11 text-sm text-foreground placeholder:text-muted/70 shadow-lg shadow-black/5 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 backdrop-blur-xl transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <button
                    type="submit"
                    className="absolute left-2 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                  >
                    بحث
                  </button>
                </form>
              </div>

              {/* Main CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-brand px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  <span>ابدأ رحلتك مجاناً الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <Link
                  href="/subjects"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border/90 bg-surface/80 px-6 py-3.5 text-sm sm:text-base font-semibold text-foreground hover:bg-surface-raised active:scale-[0.98] transition-all backdrop-blur-md shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>استكشف المناهج</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-6 pt-6 border-t border-border/60 text-xs text-muted w-full">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                  </div>
                  <span className="font-bold text-foreground">4.9 / 5</span>
                  <span>(تقييم أكثر من 15,000 طالب)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>شروحات فيديو بدون إعلانات</span>
                </div>
              </div>
            </div>

            {/* Left Column (RTL): Interactive Cockpit Stage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-md">
                {/* Ambient Aura */}
                <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-tr from-primary/30 via-secondary/25 to-accent/30 blur-2xl opacity-75 animate-pulse-glow" />

                {/* Main Interactive Cockpit Card */}
                <div className="relative rounded-3xl border border-border/80 bg-surface/90 dark:bg-slate-950/85 backdrop-blur-2xl p-6 shadow-2xl">
                  
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-primary/25">
                        خ
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">المسار النشط الآن</div>
                        <div className="font-bold text-xs sm:text-sm text-foreground">الفيزياء: الحركة الموجية والضوء</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      مباشر
                    </span>
                  </div>

                  {/* Video Stage Frame */}
                  <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-white/10 flex items-center justify-center overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-radial-glow opacity-50" />
                    
                    {/* Floating Chapter Pills */}
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10 backdrop-blur-md">
                      الوحدة 2: انعكاس وانكسار الضوء
                    </div>

                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-white shadow-xl shadow-primary/40 group hover:scale-110 active:scale-95 transition-transform cursor-pointer">
                        <Play className="h-5 w-5 fill-white translate-x-[-1px]" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        متابعة الشرح (14:25 / 28:00)
                      </span>
                    </div>

                    {/* Progress Scrubber */}
                    <div className="absolute bottom-2.5 inset-x-3 flex items-center gap-2" dir="ltr">
                      <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: "68%" }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-300">68%</span>
                    </div>
                  </div>

                  {/* Floating Live Badge Overlay */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">مسار الالتزام اليومي</div>
                        <div className="text-[10px] text-muted">14 يوماً متتالياً من المذاكرة النشطة</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">المستوى 5 ⭐</span>
                  </div>

                  {/* Bottom Stats Mini Row */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="rounded-xl border border-border/80 bg-surface p-2.5 text-center">
                      <div className="text-[10px] text-muted">آخر اختبار مجتاز</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        98% (الدرجة النهائية)
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-surface p-2.5 text-center">
                      <div className="text-[10px] text-muted">المعلم المشرف</div>
                      <div className="text-xs font-black text-foreground mt-0.5">
                        أ. محمد عبد الله
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Floating Numbers Strip */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full -mt-4 mb-16">
        <div className="rounded-3xl border border-border/80 bg-surface/80 dark:bg-slate-950/70 backdrop-blur-2xl p-6 shadow-xl shadow-black/5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse sm:divide-border/60 text-center">
            <div className="flex flex-col items-center pt-3 sm:pt-0">
              <span className="text-2xl sm:text-3xl font-black text-foreground text-gradient tracking-tight">
                +15,000
              </span>
              <span className="text-xs sm:text-sm text-muted mt-1 font-semibold">طالب مسجل</span>
            </div>
            <div className="flex flex-col items-center pt-3 sm:pt-0">
              <span className="text-2xl sm:text-3xl font-black text-foreground text-gradient tracking-tight">
                +500
              </span>
              <span className="text-xs sm:text-sm text-muted mt-1 font-semibold">درس ومحاضرة ذكية</span>
            </div>
            <div className="flex flex-col items-center pt-3 sm:pt-0">
              <span className="text-2xl sm:text-3xl font-black text-foreground text-gradient tracking-tight">
                +25,000
              </span>
              <span className="text-xs sm:text-sm text-muted mt-1 font-semibold">اختبار مصحح فورياً</span>
            </div>
            <div className="flex flex-col items-center pt-3 sm:pt-0">
              <span className="text-2xl sm:text-3xl font-black text-foreground text-gradient tracking-tight">
                99.2%
              </span>
              <span className="text-xs sm:text-sm text-muted mt-1 font-semibold">نسبة رضا وتفوق</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Roles Ecosystem (RoleTabs) */}
      <section className="py-16 md:py-24 relative" id="ecosystem">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
              <Compass className="w-3.5 h-3.5" />
              <span>منظومة متكاملة لجميع الأطراف</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              بيئة تعليمية صُممت لكل دور باحترافية استثنائية
            </h2>
            <p className="mt-3 text-xs sm:text-base text-muted">
              بدل الواجهات المكررة، اضغط أدناه لاكتشاف ما تقدمه خُطى للطالب والمعلم وولي الأمر والإدارة:
            </p>
          </div>

          {/* Interactive Role Tabs Client Component */}
          <RoleTabs />
        </div>
      </section>

      {/* 4. The 4-Step Success Roadmap (مسار خُطى نحو القمة) */}
      <section className="py-16 md:py-24 border-t border-border/60 bg-surface-raised/40 relative" id="roadmap">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-3 border border-secondary/20">
              <Target className="w-3.5 h-3.5" />
              <span>خريطة الطريق الأكاديمية</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              مسارك في خُـطَـى من الصفر حتى التميز والكلية
            </h2>
            <p className="mt-3 text-xs sm:text-base text-muted">
              طريقك ليس عشوائياً: هكذا نسير معك خطوة بخطوة حتى تصل لأعلى مجموع
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-border/80 bg-surface p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-sm border border-primary/20">
                  01
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                  الخطوة الأولى
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">تحديد المسار والهدف</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                اختيار صفك وموادك وتحديد أهداف المذاكرة الأسبوعية وجدول المحاضرات الموصى به.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-border/80 bg-surface p-6 backdrop-blur-md transition-all hover:border-secondary/50 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary font-black text-sm border border-secondary/20">
                  02
                </span>
                <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded-full">
                  الخطوة الثانية
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">مشاهدة مركزة بدون تشتيت</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                فيديوهات عالية الجودة بدون إعلانات مع ملفات ملخصة PDF وتدوين الملاحظات الذكية.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-border/80 bg-surface p-6 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent font-black text-sm border border-accent/20">
                  03
                </span>
                <span className="text-[10px] font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full">
                  الخطوة الثالثة
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">تدريب بتصحيح فوري</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                حل بنوك الأسئلة بعد كل درس مع تفسير الإجابة وتحديد الثغرات العلمية فورياً.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-3xl border border-border/80 bg-surface p-6 backdrop-blur-md transition-all hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm border border-emerald-500/20">
                  04
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                  الخطوة الرابعة
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">المراجعة النهائية والتفوق</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                امتحانات محاكاة شاملة، متابعة ولي الأمر، والوصول للدرجة النهائية بثقة تامة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Interactive Exam Simulator Preview */}
      <section className="py-16 md:py-24 relative" id="simulator">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-3 border border-accent/20">
              <Zap className="w-3.5 h-3.5" />
              <span>جرب بنفسك الآن</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              شاهد كيف يعمل التصحيح التلقائي الفوري
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              اختر إجابتك أدناه وسيقوم المحرك الذكي بتحليلها وتفسيرها في جزء من الثانية:
            </p>
          </div>

          <ExamPreview />
        </div>
      </section>

      {/* 6. Curriculum & Subjects Explorer */}
      <section className="py-16 md:py-24 border-t border-border/60 bg-surface-raised/30 relative" id="curriculum">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>المكتبة التعليمية الشاملة</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              استكشف المناهج والمواد الدراسية
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              تصفح حسب المرحلة الدراسية واختر مادتك المفضلة لبدء المذاكرة مباشرة
            </p>
          </div>

          <CurriculumExplorer initialSubjects={subjects} />
        </div>
      </section>

      {/* 7. Teacher Spotlight / Hall of Fame */}
      <section className="py-16 md:py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-3 border border-secondary/20">
              <Award className="w-3.5 h-3.5" />
              <span>نخبة التدريس في مصر والوطن العربي</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              تعلم مع كبار المعلمين الأوائل المعتمدين
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              معلمون ذوو خبرة واسعة في تبسيط أصعب المفاهيم وتدريبك على أنماط الامتحانات الحديثة
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "أ. محمد عبد الله",
                subj: "كبير معلمي الفيزياء",
                students: "4,820 طالب",
                exp: "خبرة 16 عاماً",
                avatar: "م",
                color: "from-blue-600 to-indigo-600",
              },
              {
                name: "أ. هشام البرماوي",
                subj: "كبير معلمي الكيمياء",
                students: "3,950 طالب",
                exp: "خبرة 14 عاماً",
                avatar: "هـ",
                color: "from-cyan-600 to-teal-600",
              },
              {
                name: "أ. طارق عبد الحميد",
                subj: "خبير الرياضيات البحتة والتطبيقية",
                students: "5,100 طالب",
                exp: "خبرة 18 عاماً",
                avatar: "ط",
                color: "from-purple-600 to-indigo-600",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${t.color} text-white font-black text-xl shadow-md`}>
                    {t.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <div className="text-xs text-primary font-semibold mt-0.5">{t.subj}</div>
                    <div className="text-[11px] text-muted">{t.exp}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                  <span className="text-muted font-medium">{t.students}</span>
                  <Link
                    href="/courses"
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>عرض الكورسات</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Student Testimonials (قصص نجاح أوائل خُطى) */}
      <section className="py-16 md:py-24 border-t border-border/60 bg-surface-raised/30 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-3 border border-emerald-500/20">
              <Star className="w-3.5 h-3.5 fill-emerald-500" />
              <span>قصص نجاح حقيقية</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              ماذا يقول أوائل الطلاب عن منصة خُـطَـى؟
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "تجربة المشاهدة بدون إعلانات YouTube وفّرت عليّ ساعات من التشتت. بنك الأسئلة والتصحيح الفوري جعلني أدخل امتحان الفيزياء وأنا واثق بنسبة 100%.",
                author: "يوسف أحمد",
                grade: "99.1% — كلية الطب البشري",
              },
              {
                quote:
                  "والدي كان بيتابع درجاتي أولاً بأول من لوحته الخاصة، وده خلاني ملتزم ومتحمس دائماً. خُطى أفضل استثمار دراسي قمت به في مرحلة الثانوية.",
                author: "سارة محمود",
                grade: "98.7% — كلية الهندسة",
              },
              {
                quote:
                  "ميزة استئناف الفيديو من الثانية اللي وقفت عندها مع الاختبارات بعد كل درس خلت المذاكرة ممتعة ومفيش تراكمات نهائياً.",
                author: "كريم حسام",
                grade: "97.8% — كلية الذكاء الاصطناعي",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/80 bg-surface p-6 backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-500 mb-3">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <Star className="w-4 h-4 fill-amber-500" />
                    <Star className="w-4 h-4 fill-amber-500" />
                    <Star className="w-4 h-4 fill-amber-500" />
                    <Star className="w-4 h-4 fill-amber-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed italic">
                    &quot;{r.quote}&quot;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <div className="font-bold text-sm text-foreground">{r.author}</div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {r.grade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Interactive FAQ Accordion */}
      <section className="py-16 md:py-24 relative" id="faq">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
              <span>إجابات واضحة</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              الأسئلة الأكثر شيوعاً
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              كل ما تحتاج لمعرفته حول منصة خُطى وكيفية الاشتراك والمتابعة
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* 10. High-Impact Illuminated Final CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-8 sm:p-14 lg:p-20 text-white text-center shadow-2xl border border-white/10">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary/25 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/30 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold mb-5 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                <span>ابدأ رحلتك اليوم مجاناً بنقرة واحدة</span>
              </span>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                جاهز لتخطو خطوتك الواثقة نحو التفوق؟
              </h2>

              <p className="mt-4 text-xs sm:text-base text-slate-300 max-w-xl leading-relaxed">
                انضم الآن لمنصة خُطى التعليمية، واستمتع بتجربة دراسة ذكية، منظمة، ومصممة خصيصاً لمساعدتك على الوصول للدرجة النهائية.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm sm:text-base font-black text-indigo-950 shadow-2xl hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <span>إنشاء حساب مجاني فوراً</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm sm:text-base font-semibold text-white hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
                >
                  <span>تسجيل الدخول</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
