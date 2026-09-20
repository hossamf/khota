import Link from "next/link";
import { Users, BookOpen, GraduationCap, ScrollText } from "lucide-react";
import { guard, signOut } from "../guard";
import { PageHeader, StatCard } from "@/components/ui/ui";

export default async function AdminDashboard() {
  const { supabase, profile } = await guard("admin");
  const [{ count: users }, { count: courses }, { count: teachers }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={`لوحة الإدارة — ${profile.full_name ?? ""}`} description="نظرة شاملة وإشراف كامل">
        <form action={signOut}>
          <button className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-danger/50 hover:text-danger transition">خروج</button>
        </form>
      </PageHeader>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/admin/users" className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></span>
          <span className="font-bold group-hover:text-primary transition">المستخدمون والتوثيق</span>
        </Link>
        <Link href="/dashboard/admin/courses" className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><BookOpen className="h-5 w-5" /></span>
          <span className="font-bold group-hover:text-primary transition">إشراف الكورسات</span>
        </Link>
        <Link href="/dashboard/admin/logs" className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><ScrollText className="h-5 w-5" /></span>
          <span className="font-bold group-hover:text-primary transition">سجل العمليات</span>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="المستخدمون" value={users ?? 0} tone="primary" />
        <StatCard label="الكورسات" value={courses ?? 0} tone="secondary" />
        <StatCard label="المدرسون" value={teachers ?? 0} tone="success" />
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border/80 bg-surface/85 p-4 text-sm text-muted backdrop-blur-xl">
        <GraduationCap className="h-5 w-5 text-primary" />
        الإدارة الكاملة (مستخدمون، محتوى، تقارير) في Phase 07.
      </div>
    </div>
  );
}
