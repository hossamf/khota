"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function adminCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, adminId: user.id };
}

async function log(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string
) {
  await supabase.from("audit_logs").insert({
    actor_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
  });
}

async function ensureRoleRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string
) {
  if (role === "teacher") {
    await supabase.from("teachers").upsert({ profile_id: userId }, { onConflict: "profile_id" });
  } else if (role === "student") {
    await supabase.from("students").upsert({ profile_id: userId }, { onConflict: "profile_id" });
  } else if (role === "parent") {
    await supabase.from("parents").upsert({ profile_id: userId }, { onConflict: "profile_id" });
  }
}

export async function setUserRole(userId: string, role: string) {
  const { supabase, adminId } = await adminCtx();
  if (!["student", "teacher", "parent", "admin"].includes(role)) throw new Error("دور غير صالح");
  if (userId === adminId && role !== "admin") throw new Error("لا يمكنك سحب صلاحيتك");
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  await ensureRoleRow(supabase, userId, role);
  await log(supabase, adminId, `set_role:${role}`, "profile", userId);
  revalidatePath("/dashboard/admin/users");
}

export async function setTeacherVerified(teacherId: string, verified: boolean) {
  const { supabase, adminId } = await adminCtx();
  const { error } = await supabase.from("teachers").update({ is_verified: verified }).eq("id", teacherId);
  if (error) throw new Error(error.message);
  await log(supabase, adminId, verified ? "verify_teacher" : "unverify_teacher", "teacher", teacherId);
  revalidatePath("/dashboard/admin/users");
}

export async function adminSetCourseStatus(courseId: string, status: string) {
  const { supabase, adminId } = await adminCtx();
  if (!["draft", "review", "published", "archived"].includes(status)) throw new Error("حالة غير صالحة");
  const { error } = await supabase.from("courses").update({ status }).eq("id", courseId);
  if (error) throw new Error(error.message);
  await log(supabase, adminId, `course_status:${status}`, "course", courseId);
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
}

// ============ taxonomy (subjects / grades / tracks) ============

function makeSlug(title: string): string {
  const base = title.trim().replace(/\s+/g, "-").slice(0, 40);
  return `${base || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createTaxonomy(kind: "subject" | "grade" | "track", formData: FormData) {
  const { supabase, adminId } = await adminCtx();
  const title = String(formData.get("title_ar") || "").trim();
  if (!title) throw new Error("اكتب الاسم");
  const table = kind === "subject" ? "subjects" : kind === "grade" ? "grades" : "tracks";
  const row: Record<string, unknown> = { title_ar: title, slug: makeSlug(title) };
  if (kind === "subject") {
    row.description_ar = String(formData.get("description_ar") || "").trim() || null;
    row.grade_id = String(formData.get("grade_id") || "") || null;
  }
  const { data, error } = await supabase.from(table).insert(row).select("id").single();
  if (error) throw new Error(error.message);
  await log(supabase, adminId, `create_${kind}`, kind, (data as { id: string }).id);
  revalidatePath("/dashboard/admin/subjects");
}

export async function toggleTaxonomy(kind: "subject" | "grade" | "track", id: string, active: boolean) {
  const { supabase, adminId } = await adminCtx();
  const table = kind === "subject" ? "subjects" : kind === "grade" ? "grades" : "tracks";
  const { error } = await supabase.from(table).update({ is_active: active }).eq("id", id);
  if (error) throw new Error(error.message);
  await log(supabase, adminId, active ? `activate_${kind}` : `deactivate_${kind}`, kind, id);
  revalidatePath("/dashboard/admin/subjects");
}

export async function deleteTaxonomy(kind: "subject" | "grade" | "track", id: string) {
  const { supabase, adminId } = await adminCtx();
  const table = kind === "subject" ? "subjects" : kind === "grade" ? "grades" : "tracks";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error("لا يمكن الحذف — مرتبطة ببيانات أخرى. عطّلها بدلاً من ذلك.");
  await log(supabase, adminId, `delete_${kind}`, kind, id);
  revalidatePath("/dashboard/admin/subjects");
}
