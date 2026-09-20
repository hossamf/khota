"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/youtube";

async function teacherCtx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!teacher) redirect("/dashboard");
  return { supabase, user, teacherId: teacher.id as string };
}

async function ownCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  courseId: string
) {
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("teacher_id", teacherId)
    .single();
  if (!course) throw new Error("الكورس غير موجود أو ليس لك");
  return course;
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "course"}-${rand}`;
}

export async function createCourse(formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  const title = String(formData.get("title_ar") || "").trim();
  const subjectId = String(formData.get("subject_id") || "") || null;
  const gradeId = String(formData.get("grade_id") || "") || null;
  const description = String(formData.get("description_ar") || "").trim() || null;
  const price = Number(formData.get("price") || 0);
  if (!title) throw new Error("اكتب عنوان الكورس");

  const { data, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: teacherId,
      subject_id: subjectId,
      grade_id: gradeId,
      title_ar: title,
      slug: slugify(title),
      description_ar: description,
      price: Number.isFinite(price) ? price : 0,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/dashboard/teacher/courses/${data.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const title = String(formData.get("title_ar") || "").trim();
  const description = String(formData.get("description_ar") || "").trim() || null;
  const subjectId = String(formData.get("subject_id") || "") || null;
  const gradeId = String(formData.get("grade_id") || "") || null;
  const price = Number(formData.get("price") || 0);
  if (!title) throw new Error("اكتب عنوان الكورس");
  const { error } = await supabase
    .from("courses")
    .update({
      title_ar: title,
      description_ar: description,
      subject_id: subjectId,
      grade_id: gradeId,
      price: Number.isFinite(price) ? price : 0,
    })
    .eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function setCourseStatus(courseId: string, status: string) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  if (!["draft", "review", "published", "archived"].includes(status)) {
    throw new Error("حالة غير صالحة");
  }
  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
  revalidatePath("/courses");
}

export async function uploadThumbnail(courseId: string, formData: FormData) {
  const { supabase, user, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("اختر صورة");
  if (!file.type.startsWith("image/")) throw new Error("الملف يجب أن يكون صورة");
  if (file.size > 5 * 1024 * 1024) throw new Error("الحد الأقصى 5MB");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${courseId}/thumb-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("course-thumbnails")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw new Error(upErr.message);
  const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
  await supabase.from("courses").update({ thumbnail_url: data.publicUrl }).eq("id", courseId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function addModule(courseId: string, formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const title = String(formData.get("title_ar") || "").trim();
  if (!title) throw new Error("اكتب عنوان الوحدة");
  const { data: last } = await supabase
    .from("course_modules")
    .select("order_num")
    .eq("course_id", courseId)
    .order("order_num", { ascending: false })
    .limit(1)
    .single();
  const { error } = await supabase.from("course_modules").insert({
    course_id: courseId,
    title_ar: title,
    order_num: (last?.order_num ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function renameModule(moduleId: string, courseId: string, formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const title = String(formData.get("title_ar") || "").trim();
  if (!title) throw new Error("اكتب عنوان الوحدة");
  await supabase.from("course_modules").update({ title_ar: title }).eq("id", moduleId).eq("course_id", courseId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function deleteModule(moduleId: string, courseId: string) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  await supabase.from("course_modules").delete().eq("id", moduleId).eq("course_id", courseId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function moveModule(moduleId: string, courseId: string, dir: "up" | "down") {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const { data: mods } = await supabase
    .from("course_modules")
    .select("id,order_num")
    .eq("course_id", courseId)
    .order("order_num", { ascending: true });
  const list = mods ?? [];
  const i = list.findIndex((m) => m.id === moduleId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  await supabase.from("course_modules").update({ order_num: b.order_num }).eq("id", a.id);
  await supabase.from("course_modules").update({ order_num: a.order_num }).eq("id", b.id);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function addLesson(moduleId: string, courseId: string, formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const title = String(formData.get("title_ar") || "").trim();
  const rawVideo = String(formData.get("youtube") || "").trim();
  const isFree = formData.get("is_free") === "on";
  const status = String(formData.get("status") || "draft");
  if (!title) throw new Error("اكتب عنوان الدرس");

  let youtubeId: string | null = null;
  if (rawVideo) {
    youtubeId = parseYouTubeId(rawVideo);
    if (!youtubeId) throw new Error("رابط/معرف يوتيوب غير صالح");
  }
  const { data: last } = await supabase
    .from("lessons")
    .select("order_num")
    .eq("module_id", moduleId)
    .order("order_num", { ascending: false })
    .limit(1)
    .single();
  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    course_id: courseId,
    title_ar: title,
    type: "youtube",
    youtube_video_id: youtubeId,
    order_num: (last?.order_num ?? 0) + 1,
    is_free: isFree,
    status: ["draft", "published"].includes(status) ? status : "draft",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function updateLesson(lessonId: string, courseId: string, formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const title = String(formData.get("title_ar") || "").trim();
  const rawVideo = String(formData.get("youtube") || "").trim();
  const isFree = formData.get("is_free") === "on";
  const status = String(formData.get("status") || "draft");
  if (!title) throw new Error("اكتب عنوان الدرس");
  let youtubeId: string | null = null;
  if (rawVideo) {
    youtubeId = parseYouTubeId(rawVideo);
    if (!youtubeId) throw new Error("رابط/معرف يوتيوب غير صالح");
  }
  const { error } = await supabase
    .from("lessons")
    .update({
      title_ar: title,
      youtube_video_id: youtubeId,
      is_free: isFree,
      status: ["draft", "published", "archived"].includes(status) ? status : "draft",
    })
    .eq("id", lessonId)
    .eq("course_id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  await supabase.from("lessons").delete().eq("id", lessonId).eq("course_id", courseId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function moveLesson(lessonId: string, moduleId: string, courseId: string, dir: "up" | "down") {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,order_num")
    .eq("module_id", moduleId)
    .order("order_num", { ascending: true });
  const list = lessons ?? [];
  const i = list.findIndex((l) => l.id === lessonId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  await supabase.from("lessons").update({ order_num: b.order_num }).eq("id", a.id);
  await supabase.from("lessons").update({ order_num: a.order_num }).eq("id", b.id);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
}

export async function updateTeacherProfile(formData: FormData) {
  const { supabase, user, teacherId } = await teacherCtx();
  const username = String(formData.get("username") || "").trim().toLowerCase() || null;
  const bio = String(formData.get("bio_ar") || "").trim() || null;
  if (username && !/^[a-z0-9_.-]{3,30}$/.test(username)) {
    throw new Error("اسم المستخدم: حروف إنجليزية/أرقام 3-30");
  }
  const { error } = await supabase
    .from("teachers")
    .update({ username, bio_ar: bio })
    .eq("id", teacherId);
  if (error) throw new Error("اسم المستخدم مستخدم بالفعل");
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id).select("id").limit(0);
  revalidatePath("/dashboard/teacher");
}

// ============ YouTube (keyless sync via channel RSS) ============

function parseRssEntries(xml: string): { videoId: string; title: string; published: string }[] {
  const entries: { videoId: string; title: string; published: string }[] = [];
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  for (const b of blocks) {
    const id = b.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = b.match(/<title>([^<]*)<\/title>/)?.[1];
    const published = b.match(/<published>([^<]+)<\/published>/)?.[1];
    if (id && title) entries.push({ videoId: id, title, published: published ?? new Date().toISOString() });
  }
  return entries;
}

export async function connectChannel(formData: FormData) {
  const { supabase, teacherId } = await teacherCtx();
  const channelId = String(formData.get("channel_id") || "").trim();
  if (!/^UC[A-Za-z0-9_-]{20,30}$/.test(channelId)) {
    throw new Error("معرف القناة يبدأ بـ UC (من صفحة القناة > مشاركة > نسخ معرف القناة)");
  }
  const { error } = await supabase.from("youtube_channels").upsert(
    { teacher_id: teacherId, channel_id: channelId },
    { onConflict: "channel_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/teacher/youtube");
}

export async function syncChannel(channelRowId: string) {
  const { supabase, teacherId } = await teacherCtx();
  const { data: ch } = await supabase
    .from("youtube_channels")
    .select("id,channel_id")
    .eq("id", channelRowId)
    .eq("teacher_id", teacherId)
    .single();
  if (!ch) throw new Error("القناة غير موجودة");

  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channel_id}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("تعذر جلب فيديوهات القناة (تأكد من المعرف)");
  const xml = await res.text();
  const entries = parseRssEntries(xml);
  if (entries.length === 0) throw new Error("لا توجد فيديوهات في خلاصة القناة");

  let added = 0;
  for (const e of entries) {
    const { data: exists } = await supabase
      .from("youtube_videos")
      .select("id")
      .eq("video_id", e.videoId)
      .limit(1)
      .single();
    if (exists) continue;
    const { error } = await supabase.from("youtube_videos").insert({
      channel_id: ch.id,
      video_id: e.videoId,
      title: e.title,
      thumbnail_url: `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`,
      published_at: e.published,
    });
    if (!error) added++;
  }
  revalidatePath("/dashboard/teacher/youtube");
  return { total: entries.length, added };
}

export async function lessonFromVideo(videoRowId: string, moduleId: string, courseId: string) {
  const { supabase, teacherId } = await teacherCtx();
  await ownCourse(supabase, teacherId, courseId);
  const { data: mod } = await supabase
    .from("course_modules")
    .select("id")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (!mod) throw new Error("الوحدة غير موجودة");
  const { data: vid } = await supabase
    .from("youtube_videos")
    .select("id,video_id,title,channel_id,youtube_channels!inner(teacher_id)")
    .eq("id", videoRowId)
    .single();
  const v = vid as unknown as {
    video_id: string; title: string;
    youtube_channels: { teacher_id: string } | { teacher_id: string }[];
  } | null;
  const owner = v ? (Array.isArray(v.youtube_channels) ? v.youtube_channels[0]?.teacher_id : v.youtube_channels.teacher_id) : null;
  if (!v || owner !== teacherId) throw new Error("الفيديو غير موجود");

  const { data: last } = await supabase
    .from("lessons")
    .select("order_num")
    .eq("module_id", moduleId)
    .order("order_num", { ascending: false })
    .limit(1)
    .single();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      course_id: courseId,
      title_ar: v.title,
      type: "youtube",
      youtube_video_id: v.video_id,
      order_num: (last?.order_num ?? 0) + 1,
      is_free: false,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("youtube_videos").update({ lesson_id: lesson.id }).eq("id", videoRowId);
  revalidatePath(`/dashboard/teacher/courses/${courseId}`);
  revalidatePath("/dashboard/teacher/youtube");
}
