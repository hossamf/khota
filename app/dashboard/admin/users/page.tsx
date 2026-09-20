import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setTeacherVerified } from "@/app/actions/admin";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const [{ data: users }, { data: pendingTeachers }] = await Promise.all([
    supabase.from("profiles").select("id,role,full_name,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("teachers").select("id,is_verified,profiles!inner(full_name)").eq("is_verified", false).limit(20),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="المستخدمون" description="التوثيق والأدوار" />

      {(pendingTeachers ?? []).length > 0 ? (
        <>
          <h2 className="mb-3 font-black">مدرسون بانتظار التوثيق ({pendingTeachers?.length})</h2>
          <div className="mb-8 flex flex-col gap-2">
            {(pendingTeachers ?? []).map((t: { id: string; profiles: { full_name: string | null } | { full_name: string | null }[] }) => {
              const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
              return (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-warning/50 bg-warning/5 p-4 text-sm backdrop-blur-xl">
                  <span className="font-bold">{p?.full_name ?? t.id.slice(0, 8)}</span>
                  <form action={setTeacherVerified.bind(null, t.id, true)}>
                    <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand px-4 py-1.5 text-xs font-bold text-white shadow hover:opacity-95 transition">
                      <BadgeCheck className="h-3.5 w-3.5" /> توثيق
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <h2 className="mb-3 font-black">أحدث المستخدمين</h2>
      <div className="overflow-x-auto rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2/60 text-right">
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">الدور</th>
              <th className="px-4 py-3">تغيير الدور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(users ?? []).map((u: { id: string; role: string; full_name: string | null }) => (
              <tr key={u.id} className="transition hover:bg-surface-2/50">
                <td className="px-4 py-3 font-bold">{u.full_name ?? u.id.slice(0, 8)}</td>
                <td className="px-4 py-3"><Badge tone={u.role === "admin" ? "accent" : u.role === "teacher" ? "primary" : "muted"}>{u.role}</Badge></td>
                <td className="px-4 py-3">
                  <RoleForm userId={u.id} current={u.role} self={u.id === user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleForm({ userId, current, self }: { userId: string; current: string; self: boolean }) {
  async function action(formData: FormData) {
    "use server";
    const role = String(formData.get("role") || "");
    const { setUserRole } = await import("@/app/actions/admin");
    await setUserRole(userId, role);
  }
  return (
    <form action={action} className="flex gap-1.5">
      <select name="role" defaultValue={current} disabled={self} className={fieldCls + " !w-auto !py-1.5 !text-xs"}>
        <option value="student">student</option>
        <option value="teacher">teacher</option>
        <option value="parent">parent</option>
        <option value="admin">admin</option>
      </select>
      <button disabled={self} className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold disabled:opacity-40 hover:border-primary/50 transition">حفظ</button>
    </form>
  );
}
