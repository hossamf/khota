import { createClient } from "@/lib/supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

async function rpc(supabase: Supa, fn: string, args: Record<string, unknown>) {
  try {
    await supabase.rpc(fn, args);
  } catch {
    /* gamification is best-effort (e.g. migration not applied yet) */
  }
}

/** Called when a lesson transitions to completed. Awards XP, streak, badges. */
export async function onLessonCompleted(
  supabase: Supa,
  studentId: string,
  lessonId: string,
  courseId: string,
  coursePercent: number
) {
  let streak = 1;
  try {
    const r = await supabase.rpc("record_activity", { p_student: studentId });
    if (typeof r.data === "number") streak = r.data;
  } catch {
    /* best-effort */
  }

  await rpc(supabase, "award_xp", {
    p_student: studentId,
    p_amount: 10,
    p_reason: "lesson_completed",
    p_ref_type: "lesson",
    p_ref_id: lessonId,
  });

  // First lesson ever?
  const { count } = await supabase
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("completed", true);
  if ((count ?? 0) <= 1) {
    await rpc(supabase, "award_badge", { p_student: studentId, p_slug: "first-step" });
  }

  if (streak >= 7) {
    await rpc(supabase, "award_badge", { p_student: studentId, p_slug: "streak-7" });
  }

  if (coursePercent >= 100) {
    await rpc(supabase, "award_xp", {
      p_student: studentId,
      p_amount: 100,
      p_reason: "course_completed",
      p_ref_type: "course",
      p_ref_id: courseId,
    });
    await rpc(supabase, "award_badge", { p_student: studentId, p_slug: "course-complete" });
    // Certificates agent owns this module; call it only if delivered.
    // Non-literal specifier: must not break the build before delivery.
    try {
      const certPath = ["@/app", "actions", "certificates"].join("/");
      const mod = (await import(certPath).catch(() => null)) as {
        maybeIssueCertificate?: (s: string, c: string) => Promise<unknown>;
      } | null;
      if (mod?.maybeIssueCertificate) await mod.maybeIssueCertificate(studentId, courseId);
    } catch {
      /* not delivered yet */
    }
  }
}

/** Called after an exam attempt is graded. */
export async function onExamSubmitted(
  supabase: Supa,
  studentId: string,
  attemptId: string,
  percent: number
) {
  await rpc(supabase, "record_activity", { p_student: studentId });
  await rpc(supabase, "award_xp", {
    p_student: studentId,
    p_amount: 20,
    p_reason: "exam_submitted",
    p_ref_type: "attempt",
    p_ref_id: attemptId,
  });

  const { count } = await supabase
    .from("exam_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "graded");
  if ((count ?? 0) <= 1) {
    await rpc(supabase, "award_badge", { p_student: studentId, p_slug: "first-exam" });
  }
  if (percent >= 100) {
    await rpc(supabase, "award_badge", { p_student: studentId, p_slug: "perfect-score" });
  }
}
