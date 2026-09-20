import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/ui";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const { data: courses } = await supabase
    .from("courses").select("id,title_ar").eq("teacher_id", teacher.id);
  const ids = (courses ?? []).map((c) => c.id);

  let rows: {
    progress_percent: number; enrolled_at: string;
    courses: { title_ar: string } | { title_ar: string }[] | null;
    students: { profiles: { full_name: string | null } | { full_name: string | null }[] | null } | null;
  }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("progress_percent,enrolled_at,courses(title_ar),students(profiles(full_name))")
      .in("course_id", ids)
      .order("enrolled_at", { ascending: false })
      .limit(100);
    rows = ((data ?? []) as unknown) as typeof rows;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title={`طلابي (${rows.length})`} description="المشتركون في كورساتك وتقدمهم" />
      {rows.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center text-sm text-muted">لا يوجد مشتركون في كورساتك بعد.</div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2/60 text-right">
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">الكورس</th>
                <th className="px-4 py-3">التقدم</th>
                <th className="px-4 py-3">منذ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r, i) => {
                const c = Array.isArray(r.courses) ? r.courses[0] : r.courses;
                const profs = r.students?.profiles;
                const p = Array.isArray(profs) ? profs[0] : profs;
                return (
                  <tr key={i} className="transition hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-bold">{p?.full_name ?? "—"}</td>
                    <td className="px-4 py-3">{c?.title_ar ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2" dir="ltr">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                          <span className="block h-full rounded-full bg-gradient-brand" style={{ width: `${r.progress_percent}%` }} />
                        </span>
                        <b>{r.progress_percent}%</b>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(r.enrolled_at).toLocaleDateString("ar")}</td>
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
