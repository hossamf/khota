import Link from "next/link";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="text-lg font-black">{brand.name}</div>
          <p className="mt-2 text-sm text-muted">{brand.heroSubtitle}</p>
        </div>
        <div>
          <div className="mb-3 font-bold">اكتشف</div>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link href="/subjects" className="hover:text-foreground">المواد</Link>
            <Link href="/courses" className="hover:text-foreground">الكورسات</Link>
            <Link href="/exams" className="hover:text-foreground">الاختبارات</Link>
          </div>
        </div>
        <div>
          <div className="mb-3 font-bold">حسابك</div>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <Link href="/login" className="hover:text-foreground">دخول</Link>
            <Link href="/register" className="hover:text-foreground">حساب جديد</Link>
            <Link href="/dashboard" className="hover:text-foreground">لوحتي</Link>
          </div>
        </div>
        <div>
          <div className="mb-3 font-bold">رحلتك</div>
          <p className="text-sm text-muted">{brand.tagline}</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        {brand.name} © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
