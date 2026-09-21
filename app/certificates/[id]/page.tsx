import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, Award, Calendar, User, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card } from "@/components/ui/ui";

export const metadata: Metadata = {
  title: "التحقق من صحة الشهادة | خُطى KHOTA",
  description: "خدمة التحقق الرسمية من شهادات إتمام المقررات في منصة خُطى التعليمية",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getSupabase() {
  try {
    return createServiceClient();
  } catch {
    return await createClient();
  }
}

interface CertQueryResult {
  id: string;
  verification_code: string;
  issued_at: string;
  students: {
    id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  courses: {
    id: string;
    title_ar: string;
    teachers: {
      id: string;
      profiles: {
        full_name: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
  } | null;
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const { id: rawParam } = await params;
  const lookupKey = decodeURIComponent(rawParam ?? "").trim();

  const supabase = await getSupabase();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lookupKey);

  let query = supabase
    .from("certificates")
    .select(`
      id,
      verification_code,
      issued_at,
      students (
        id,
        profiles (
          full_name,
          avatar_url
        )
      ),
      courses (
        id,
        title_ar,
        teachers (
          id,
          profiles (
            full_name,
            avatar_url
          )
        )
      )
    `);

  if (isUuid) {
    query = query.or(`id.eq.${lookupKey},verification_code.eq.${lookupKey}`);
  } else {
    query = query.ilike("verification_code", lookupKey);
  }

  const { data: certData } = await query.maybeSingle();
  const raw = certData as unknown as CertQueryResult | null;
  // Normalize: PostgREST may return arrays for embedded relations
  const one = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  const cert = raw
    ? {
        ...raw,
        students: raw.students
          ? { ...raw.students, profiles: one(raw.students.profiles) }
          : null,
        courses: raw.courses
          ? {
              ...raw.courses,
              teachers: raw.courses.teachers
                ? { ...raw.courses.teachers, profiles: one(raw.courses.teachers.profiles) }
                : null,
            }
          : null,
      }
    : null;

  const isValid = Boolean(cert);

  const formattedDate = cert?.issued_at
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(cert.issued_at))
    : null;

  const studentName = cert?.students?.profiles?.full_name || "طالب خُطى";
  const courseTitle = cert?.courses?.title_ar || "مقرر تعليمي";
  const teacherName = cert?.courses?.teachers?.profiles?.full_name || "معلم معتمد";
  const verificationCode = cert?.verification_code || lookupKey;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl z-10">
        {/* Platform Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-black text-xl shadow-lg shadow-brand/20 group-hover:scale-105 transition">
              خ
            </span>
            <span className="text-2xl font-black tracking-tight">خُطى <span className="text-brand text-sm font-bold">KHOTA</span></span>
          </Link>
          <p className="text-sm text-muted">بوابة التحقق الرسمية من صحة الوثائق والشهادات الأكاديمية</p>
        </div>

        {isValid && cert ? (
          <Card className="border-2 border-border/80 shadow-2xl backdrop-blur-xl relative overflow-hidden p-6 sm:p-10">
            {/* Top gold ribbon bar */}
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />

            {/* Verification Status Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black">شهادة معتمدة وموثقة</h2>
                    <Badge tone="success">صحيحة ومسجلة</Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">تم التحقق من سجلات منصة خُطى بنجاح</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-xl border border-border text-xs font-mono">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-muted">رمز التحقق:</span>
                <span className="font-bold text-foreground">{verificationCode}</span>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="my-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                <Award className="h-8 w-8" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-muted font-bold">تشهد منصة خُطى التعليمية بأن</p>
                <h1 className="mt-2 text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                  {studentName}
                </h1>
              </div>

              <div className="max-w-xl mx-auto">
                <p className="text-sm text-muted leading-relaxed">
                  قد أتم بنجاح متطلبات واختبارات المقرر التعليمي
                </p>
                <div className="mt-2 inline-block rounded-2xl bg-surface-2 border border-border/80 px-6 py-3 shadow-inner">
                  <h3 className="text-lg sm:text-xl font-black text-brand">
                    {courseTitle}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-muted">
                  بنسبة إنجاز 100% مستوفياً جميع معايير الكفاءة المقررة
                </p>
              </div>

              {/* Metadata details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/70 text-right">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface/80 border border-border/50">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted block">المشرف الأكاديمي</span>
                    <span className="text-sm font-bold text-foreground">{teacherName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface/80 border border-border/50">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted block">تاريخ الإصدار</span>
                    <span className="text-sm font-bold text-foreground">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-muted flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                صادرة عن النظام الآلي لمنصة خُطى التعليمية
              </span>

              <div className="flex items-center gap-2">
                <Link href={`/courses`}>
                  <Button variant="outline" size="sm">
                    استكشف المقررات
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="primary" size="sm">
                    الرئيسية
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          /* Certificate Not Found State */
          <Card className="border-2 border-danger/30 shadow-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-danger" />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-5">
              <XCircle className="h-9 w-9" />
            </div>

            <Badge tone="accent" className="bg-danger/10 text-danger mb-3">
              شهادة غير موجودة
            </Badge>

            <h1 className="text-2xl font-black text-foreground sm:text-3xl">
              تعذر العثور على الشهادة
            </h1>

            <p className="mt-3 text-sm text-muted max-w-md mx-auto leading-relaxed">
              لم يتم العثور على شهادة مسجلة برمز التحقق{" "}
              <span className="font-mono font-bold text-foreground bg-surface-2 px-2 py-0.5 rounded border border-border">
                {lookupKey || "فارغ"}
              </span>
              . يرجى التأكد من كتابة الكود بشكل دقيق أو التواصل مع إدارة المنصة.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button variant="primary" size="md">
                  <ArrowRight className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" size="md">
                  تصفح المقررات
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
