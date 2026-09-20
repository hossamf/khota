import { redirect } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createTaxonomy, toggleTaxonomy, deleteTaxonomy } from "@/app/actions/admin";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";

type Kind = "subject" | "grade" | "track";

function Section({
  kind,
  title,
  items,
  grades,
}: {
  kind: Kind;
  title: string;
  items: { id: string; title_ar: string; is_active: boolean; description_ar?: string | null }[];
  grades?: { id: string; title_ar: string }[];
}) {
  return (
    <section className="rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl">
      <h2 className="mb-4 font-black">{title} ({items.length})</h2>
      <form action={createTaxonomy.bind(null, kind)} className="mb-4 grid gap-2.5 md:grid-cols-3">
        <input name="title_ar" required placeholder="اسم جديد" className={fieldCls} />
        {kind === "subject" ? (
          <>
            <input name="description_ar" placeholder="وصف مختصر (اختياري)" className={fieldCls} />
            <select name="grade_id" className={fieldCls}>
              <option value="">بدون صف</option>
              {(grades ?? []).map((g) => <option key={g.id} value={g.id}>{g.title_ar}</option>)}
            </select>
          </>
        ) : null}
        <button type="submit" className="rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-white shadow hover:opacity-95 transition md:col-start-1">+ إضافة</button>
      </form>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted">لا توجد عناصر.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-sm ${it.is_active ? "border-border" : "border-border opacity-60"}`}>
              <div>
                <span className="font-bold">{it.title_ar}</span>
                {!it.is_active ? <Badge tone="muted">معطلة</Badge> : null}
              </div>
              <div className="flex gap-1.5">
                <form action={toggleTaxonomy.bind(null, kind, it.id, !it.is_active)}>
                  <button title={it.is_active ? "تعطيل" : "تفعيل"} className="rounded-lg border border-border p-1.5 hover:border-primary/50 transition">
                    {it.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </form>
                <form action={deleteTaxonomy.bind(null, kind, it.id)}>
                  <button title="حذف" className="rounded-lg border border-border p-1.5 text-danger hover:border-danger/50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default async function AdminTaxonomyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/dashboard");

  const [{ data: subjects }, { data: grades }, { data: tracks }] = await Promise.all([
    supabase.from("subjects").select("id,title_ar,is_active").order("order_num").limit(200),
    supabase.from("grades").select("id,title_ar,is_active").order("order_num").limit(100),
    supabase.from("tracks").select("id,title_ar,is_active").limit(100),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="المواد والصفوف والمسارات" description="التصنيفات التي تُبنى عليها الكورسات" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section kind="subject" title="المواد" items={(subjects ?? []) as { id: string; title_ar: string; is_active: boolean }[]} grades={(grades ?? []) as { id: string; title_ar: string }[]} />
        <div className="flex flex-col gap-5">
          <Section kind="grade" title="الصفوف" items={(grades ?? []) as { id: string; title_ar: string; is_active: boolean }[]} />
          <Section kind="track" title="المسارات" items={(tracks ?? []) as { id: string; title_ar: string; is_active: boolean }[]} />
        </div>
      </div>
    </div>
  );
}
