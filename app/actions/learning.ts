"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function studentIdFor(userId: string) {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", userId)
    .single();
  return { supabase, studentId: student?.id ?? null };
}

async function recomputeCourseProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  courseId: string
) {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "published");
  const total = lessons?.length ?? 0;
  let done = 0;
  if (total > 0 && lessons) {
    const { data: prog } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .eq("completed", true)
      .in(
        "lesson_id",
        lessons.map((l) => l.id)
      );
    done = prog?.length ?? 0;
  }
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  await supabase.from("course_progress").upsert(
    {
      student_id: studentId,
      course_id: courseId,
      percent,
      completed_lessons: done,
      total_lessons: total,
    },
    { onConflict: "student_id,course_id" }
  );
  await supabase
    .from("enrollments")
    .update({ progress_percent: percent })
    .eq("student_id", studentId)
    .eq("course_id", courseId);
  return { percent, done, total };
}

export async function enroll(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { studentId } = await studentIdFor(user.id);
  if (!studentId) throw new Error("هذا الحساب ليس طالباً");

  const { data: course } = await supabase
    .from("courses")
    .select("id,status")
    .eq("id", courseId)
    .single();
  if (!course || course.status !== "published") throw new Error("الكورس غير متاح");

  await supabase.from("enrollments").upsert(
    { student_id: studentId, course_id: courseId },
    { onConflict: "student_id,course_id" }
  );
  await recomputeCourseProgress(supabase, studentId, courseId);
  revalidatePath("/dashboard/student");
}

/** 80% rule: watch_percent >= 80 marks the lesson completed. */
export async function savePosition(
  lessonId: string,
  positionSec: number,
  durationSec: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { studentId } = await studentIdFor(user.id);
  if (!studentId) return;

  const percent =
    durationSec > 0
      ? Math.min(100, Math.round((positionSec / durationSec) * 100))
      : 0;
  const completed = percent >= 80;

  await supabase.from("video_progress").upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      position_sec: Math.floor(positionSec),
      duration_sec: Math.floor(durationSec),
    },
    { onConflict: "student_id,lesson_id" }
  );
  await supabase.from("lesson_progress").upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      watch_percent: percent,
      completed,
      last_position_sec: Math.floor(positionSec),
    },
    { onConflict: "student_id,lesson_id" }
  );

  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .single();
  if (lesson) await recomputeCourseProgress(supabase, studentId, lesson.course_id);
  return { percent, completed };
}

export async function completeLesson(lessonId: string) {
  return savePosition(lessonId, 100, 100);
}

export async function addNote(
  lessonId: string,
  content: string,
  timestampSec: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { studentId } = await studentIdFor(user.id);
  if (!studentId) throw new Error("هذا الحساب ليس طالباً");
  if (!content.trim()) throw new Error("اكتب الملاحظة أولاً");

  await supabase.from("notes").insert({
    student_id: studentId,
    lesson_id: lessonId,
    content: content.trim(),
    timestamp_sec: Math.floor(timestampSec),
  });
  revalidatePath(`/courses`);
}
