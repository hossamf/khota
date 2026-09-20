import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/ui";

export default async function AdminLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: logs } = await supabase
    .from("audit_logs").select("id,action,target_type,target_id,created_at,actor_id,profiles(full_name)")
    .order("created_at", { ascending: false }).limit(100);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="سجل العمليات" description="كل إجراءات الإدارة موثقة" />
      {(logs ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center text-sm text-muted">لا توجد عمليات مسجلة بعد.</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2/60 text-right">
                <th className="px-4 py-3">الوقت</th>
                <th className="px-4 py-3">الفاعل</th>
                <th className="px-4 py-3">الإجراء</th>
                <th className="px-4 py-3">الهدف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(logs ?? []).map((l: {
                id: string; action: string; target_type: string | null; target_id: string | null;
                created_at: string; actor_id: string | null;
                profiles: { full_name: string | null } | { full_name: string | null }[] | null;
              }) => {
                const p = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
                return (
                  <tr key={l.id} className="transition hover:bg-surface-2/50">
                    <td className="px-4 py-3 text-muted" dir="ltr">{new Date(l.created_at).toLocaleString("ar")}</td>
                    <td className="px-4 py-3 font-bold">{p?.full_name ?? l.actor_id?.slice(0, 8) ?? "—"}</td>
                    <td className="px-4 py-3" dir="ltr"><code className="rounded-lg bg-surface-2 px-2 py-1 text-xs">{l.action}</code></td>
                    <td className="px-4 py-3 text-muted" dir="ltr">{l.target_type}:{l.target_id?.slice(0, 8)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
