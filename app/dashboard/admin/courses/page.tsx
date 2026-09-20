import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminSetCourseStatus } from "@/app/actions/admin";
import { PageHeader, Badge } from "@/components/ui/ui";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const { data: courses } = await supabase
    .from("courses").select("id,title_ar,slug,status,teachers!inner(profiles!inner(full_name))")
    .order("created_at", { ascending: false }).limit(50);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="إشراف الكورسات" description="النشر والأرشفة لكل كورسات المنصة" />
      {(courses ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center text-sm text-muted">لا توجد كورسات.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {(courses ?? []).map((c: {
            id: string; title_ar: string; slug: string; status: string;
            teachers: { profiles: { full_name: string | null } | { full_name: string | null }[] } | { profiles: { full_name: string | null } | { full_name: string | null }[] }[] | null;
          }) => {
            const t = Array.isArray(c.teachers) ? c.teachers[0] : c.teachers;
            const p = t ? (Array.isArray(t.profiles) ? t.profiles[0] : t.profiles) : null;
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 text-sm backdrop-blur-xl">
                <div>
                  <Link href={`/courses/${c.slug}`} className="font-bold hover:text-primary transition">{c.title_ar}</Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{p?.full_name ?? ""}</span>
                    <Badge tone={c.status === "published" ? "success" : c.status === "review" ? "accent" : "muted"}>{c.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(["draft", "review", "published", "archived"] as const).map((s) => (
                    <form key={s} action={adminSetCourseStatus.bind(null, c.id, s)}>
                      <button disabled={c.status === s} className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold disabled:opacity-40 hover:border-primary/50 transition">{s}</button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
