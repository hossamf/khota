import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="absolute top-1/3 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <BrandLogo size="lg" showText={false} href="" />
      <div className="text-6xl font-black text-muted">404</div>
      <h1 className="text-xl font-black">الصفحة غير موجودة</h1>
      <p className="text-sm text-muted">الرابط غير صحيح أو المحتوى حُذف.</p>
      <div className="flex gap-2">
        <Link href="/" className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 transition-all">الرئيسية</Link>
        <Link href="/courses" className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold hover:border-primary/50 transition">الكورسات</Link>
      </div>
    </div>
  );
}
