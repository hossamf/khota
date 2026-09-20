// Phase 04 test-content seed. Uses SERVICE_ROLE (bypasses RLS).
// Creates REAL rows: grade + track + subject + a published demo course
// for the FIRST verified-or-any teacher. Delete anytime from Admin later.
// Run: node scripts/seed-phase04.mjs
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = fs.readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, service);

async function upsert(table, row, onConflict) {
  const { data, error } = await db.from(table).upsert(row, { onConflict }).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

const grade = await upsert("grades", { title_ar: "الصف الثالث الثانوي", slug: "grade-3-sec", order_num: 1 }, "slug");
await upsert("tracks", { title_ar: "علمي علوم", slug: "science" }, "slug");
const subject = await upsert(
  "subjects",
  { title_ar: "الفيزياء", slug: "physics", description_ar: "مادة الفيزياء للثانوية العامة", grade_id: grade.id },
  "slug"
);

const { data: teacher } = await db.from("teachers").select("id").limit(1).single();
if (!teacher) {
  console.log("No teacher found. Register a teacher account first, then re-run.");
  process.exit(2);
}

const course = await upsert(
  "courses",
  {
    teacher_id: teacher.id,
    subject_id: subject.id,
    grade_id: grade.id,
    title_ar: "تأسيس الفيزياء (محتوى تجريبي)",
    slug: "physics-basics-demo",
    description_ar: "محتوى تجريبي للاختبار — احذفه قبل الإطلاق.",
    status: "published",
  },
  "slug"
);

let mod = (
  await db.from("course_modules").select("id").eq("course_id", course.id).limit(1).single()
).data;
if (!mod) {
  mod = (
    await db.from("course_modules").insert({ course_id: course.id, title_ar: "المدخل", order_num: 1 }).select("id").single()
  ).data;
}

const existing = (
  await db.from("lessons").select("order_num").eq("course_id", course.id)
).data ?? [];
const has = (n) => existing.some((l) => l.order_num === n);

if (!has(1)) {
  await db.from("lessons").insert({
    module_id: mod.id,
    course_id: course.id,
    title_ar: "مقدمة (مجاني)",
    type: "youtube",
    youtube_video_id: "aqz-KE-bpKQ",
    order_num: 1,
    is_free: true,
    status: "published",
  });
}
if (!has(2)) {
  await db.from("lessons").insert({
    module_id: mod.id,
    course_id: course.id,
    title_ar: "الدرس الأول — للمشتركين",
    type: "youtube",
    youtube_video_id: "aqz-KE-bpKQ",
    order_num: 2,
    is_free: false,
    status: "published",
  });
}

console.log("SEED_OK course=/courses/physics-basics-demo");
