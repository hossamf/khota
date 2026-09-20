import { createClient } from "@/lib/supabase/server";

/** Insert in-app notifications (RLS: own / own-students / admin). */
export async function notifyUsers(
  userIds: string[],
  n: { type: string; title_ar: string; body_ar?: string | null; link?: string | null }
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;
  const supabase = await createClient();
  await supabase.from("notifications").insert(
    unique.map((user_id) => ({
      user_id,
      type: n.type,
      title_ar: n.title_ar,
      body_ar: n.body_ar ?? null,
      link: n.link ?? null,
    }))
  );
}

/** Profile IDs of students enrolled in a course (teacher/admin readable). */
export async function enrolledProfileIds(courseId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("student_id,students!inner(profile_id)")
    .eq("course_id", courseId)
    .limit(1000);
  const rows = (data ?? []) as unknown as {
    students: { profile_id: string } | { profile_id: string }[];
  }[];
  return rows.map((r) =>
    Array.isArray(r.students) ? r.students[0]?.profile_id : r.students?.profile_id
  ).filter(Boolean) as string[];
}
