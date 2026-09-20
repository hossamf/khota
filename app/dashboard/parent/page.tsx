import { Users } from "lucide-react";
import { guard, signOut } from "../guard";
import { PageHeader } from "@/components/ui/ui";

export default async function ParentDashboard() {
  const { supabase, user, profile } = await guard("parent");
  const { data: parent } = await supabase
    .from("parents").select("id").eq("profile_id", user.id).single();
  const { data: children } = parent
    ? await supabase.from("parent_children").select("student_id,students(id,profiles!inner(full_name))").eq("parent_id", parent.id)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title={`متابعة الأبناء — ${profile.full_name ?? ""}`} description="تقدم أبنائك ونتائجهم">
        <form action={signOut}>
          <button className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-danger/50 hover:text-danger transition">خروج</button>
        </form>
      </PageHeader>
      {(children ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted">لا يوجد أبناء مرتبطون بعد. الربط يتم من لوحة الإدارة.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(children ?? []).map((c: { student_id: string }) => (
            <div key={c.student_id} className="rounded-3xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl">
              <div className="font-black">{c.student_id.slice(0, 8)}…</div>
              <p className="mt-1 text-sm text-muted">التقارير التفصيلية في Phase لاحقة.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
