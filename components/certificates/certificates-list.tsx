import Link from "next/link";
import { Award, Calendar, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/ui";

export interface CertificateListItem {
  id: string;
  verification_code: string;
  issued_at: string;
  course_id?: string;
  course_title?: string;
  course?: {
    id?: string;
    title_ar?: string;
    thumbnail_url?: string | null;
  } | null;
  teacher_name?: string | null;
}

export interface CertificatesListProps {
  items: CertificateListItem[];
  className?: string;
}

export function CertificatesList({ items, className }: CertificatesListProps) {
  if (!items || items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-10 text-center border-dashed border-2 border-border/80" dir="rtl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
          <Award className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-foreground">لا توجد شهادات صادرة بعد</h3>
        <p className="mt-2 text-sm text-muted max-w-md leading-relaxed">
          عند إتمام أي مقرر دراسي بنسبة 100%، سيتم إصدار شهادة إتمام رسمية موثقة بكود تحقق فريد تظهر في هذا المكان.
        </p>
      </Card>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className || ""}`} dir="rtl">
      {items.map((cert) => {
        const title = cert.course_title || cert.course?.title_ar || "شهادة إتمام مقرر";
        const formattedDate = cert.issued_at
          ? new Intl.DateTimeFormat("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(cert.issued_at))
          : "—";

        return (
          <Card
            key={cert.id}
            className="group relative overflow-hidden p-6 transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl flex flex-col justify-between"
          >
            {/* Top gold accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-500" />

            <div>
              {/* Header with Award icon and verified badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6" />
                </div>
                <Badge tone="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  معتمدة
                </Badge>
              </div>

              {/* Course Title */}
              <h4 className="text-base font-black text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {title}
              </h4>

              {/* Teacher name if provided */}
              {cert.teacher_name ? (
                <p className="text-xs text-muted mb-3">
                  المشرف: <span className="font-bold text-foreground">{cert.teacher_name}</span>
                </p>
              ) : null}

              {/* Verification Code Box */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 border border-border/80 text-xs">
                <span className="text-muted flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {cert.verification_code}
                </span>
                <span className="text-[10px] text-muted font-bold">كود التحقق</span>
              </div>
            </div>

            {/* Footer with date and public verification link */}
            <div className="mt-5 pt-4 border-t border-border/70 flex items-center justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted" />
                {formattedDate}
              </span>

              <Link
                href={`/certificates/${cert.verification_code}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
              >
                عرض التوثيق
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default CertificatesList;
