"use server";

import { createClient } from "@/lib/supabase/server";

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("سجّل الدخول أولاً");
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!student) throw new Error("هذا الحساب ليس طالباً");
  return { supabase, studentId: student.id as string };
}

export async function toggleFavoriteLesson(lessonId: string) {
  const { supabase, studentId } = await requireStudent();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .limit(1)
    .single();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("favorites").insert({ student_id: studentId, lesson_id: lessonId });
  return true;
}

export async function toggleWatchLater(lessonId: string) {
  const { supabase, studentId } = await requireStudent();
  const { data: existing } = await supabase
    .from("watch_later")
    .select("lesson_id")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .single();
  if (existing) {
    await supabase.from("watch_later").delete().eq("student_id", studentId).eq("lesson_id", lessonId);
    return false;
  }
  await supabase.from("watch_later").insert({ student_id: studentId, lesson_id: lessonId });
  return true;
}
