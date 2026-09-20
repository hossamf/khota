// V1 acceptance test (§94): empty-DB-safe end-to-end chain on the REAL backend.
// Teacher creates course -> module -> lesson -> question -> exam;
// student enrolls -> watches (progress) -> attempts -> graded;
// teacher sees student + progress; RLS isolation holds.
// All temp rows/users are deleted afterwards.
// Run: node scripts/acceptance-v1.mjs
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
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const stamp = Date.now();

let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name} ${extra}`);
  }
}

async function tempUser(role) {
  const email = `tmp-acc-${role}-${stamp}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await svc.auth.admin.createUser({
    email, password: "TmpPass123!", email_confirm: true,
    user_metadata: { role, full_name: "ACC" },
  });
  if (error) throw new Error("createUser " + role + ": " + error.message);
  const s = await createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    .auth.signInWithPassword({ email, password: "TmpPass123!" });
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${s.data.session.access_token}` } },
  });
  return { id: data.user.id, client, email };
}

const T = await tempUser("teacher");
const S = await tempUser("student");
const trash = { users: [T.id, S.id], courses: [], questions: [], exams: [], channels: [], lessons: [], attempts: [] };

try {
  // 5-7. Teacher creates course -> module -> lesson (all via teacher session = RLS write test)
  const { data: tr } = await svc.from("teachers").select("id").eq("profile_id", T.id).single();
  const c = await T.client.from("courses").insert({
    teacher_id: tr.id, title_ar: "ACC course", slug: `acc-course-${stamp}`, status: "published",
  }).select("id").single();
  check("5. teacher creates course", !!c.data?.id, c.error?.message ?? "");
  trash.courses.push(c.data.id);

  const m = await T.client.from("course_modules")
    .insert({ course_id: c.data.id, title_ar: "ACC module", order_num: 1 }).select("id").single();
  check("6. teacher creates module", !!m.data?.id, m.error?.message ?? "");

  const l = await T.client.from("lessons").insert({
    module_id: m.data.id, course_id: c.data.id, title_ar: "ACC lesson",
    type: "youtube", youtube_video_id: "aqz-KE-bpKQ", order_num: 1, is_free: true, status: "published",
  }).select("id").single();
  check("7. teacher creates lesson", !!l.data?.id, l.error?.message ?? "");
  if (l.data?.id) trash.lessons.push(l.data.id);

  // Teacher creates question + exam (0007 write path)
  const q = await T.client.from("questions").insert({
    question_ar: "ACC?", type: "mcq", status: "published", created_by: T.id,
  }).select("id").single();
  check("teacher creates question", !!q.data?.id, q.error?.message ?? "");
  trash.questions.push(q.data.id);
  const o1 = await T.client.from("question_options")
    .insert([
      { question_id: q.data.id, option_ar: "right", is_correct: true, order_num: 1 },
      { question_id: q.data.id, option_ar: "wrong", is_correct: false, order_num: 2 },
    ]).select("id");
  check("teacher adds options", (o1.data ?? []).length === 2, o1.error?.message ?? "");
  const ex = await T.client.from("exams").insert({
    course_id: c.data.id, teacher_id: tr.id, title_ar: "ACC exam", status: "published",
  }).select("id").single();
  check("teacher creates exam", !!ex.data?.id, ex.error?.message ?? "");
  trash.exams.push(ex.data.id);
  const eq = await T.client.from("exam_questions")
    .insert({ exam_id: ex.data.id, question_id: q.data.id, marks: 2 }).select("exam_id");
  check("teacher links question to exam", (eq.data ?? []).length === 1, eq.error?.message ?? "");

  // 11. Student enrolls
  const { data: st } = await svc.from("students").select("id").eq("profile_id", S.id).single();
  const en = await S.client.from("enrollments")
    .insert({ student_id: st.id, course_id: c.data.id }).select("course_id");
  check("11. student enrolls", (en.data ?? []).length === 1, en.error?.message ?? "");

  // 12-14. Student watches -> progress saved
  const lp = await S.client.from("lesson_progress").upsert({
    student_id: st.id, lesson_id: l.data.id, watch_percent: 90, completed: true, last_position_sec: 54,
  }, { onConflict: "student_id,lesson_id" }).select("lesson_id");
  check("14. progress saved", (lp.data ?? []).length === 1, lp.error?.message ?? "");

  // Student attempts exam and answers correctly
  const at = await S.client.from("exam_attempts")
    .insert({ exam_id: ex.data.id, student_id: st.id, status: "in_progress" }).select("id").single();
  check("student starts attempt", !!at.data?.id, at.error?.message ?? "");
  if (at.data?.id) trash.attempts.push(at.data.id);
  const opts = await S.client.from("question_options").select("id,is_correct").eq("question_id", q.data.id);
  const right = opts.data.find((o) => o.is_correct);
  const an = await S.client.from("exam_answers").insert({
    attempt_id: at.data.id, question_id: q.data.id,
    selected_option_id: right.id, is_correct: true, marks_awarded: 2,
  }).select("attempt_id");
  check("student answers", (an.data ?? []).length === 1, an.error?.message ?? "");
  const fin = await S.client.from("exam_attempts").update({
    score: 2, percent: 100, correct_count: 1, status: "graded",
    submitted_at: new Date().toISOString(),
  }).eq("id", at.data.id).select("percent");
  check("attempt graded 100%", fin.data?.[0]?.percent === 100, fin.error?.message ?? "");

  // 15-16. Teacher sees student + progress + attempt (0005 read path)
  const seen = await T.client.from("enrollments").select("student_id").eq("course_id", c.data.id);
  check("15. teacher sees enrolled student", (seen.data ?? []).some((r) => r.student_id === st.id), seen.error?.message ?? "");
  const tprog = await T.client.from("lesson_progress").select("completed").eq("lesson_id", l.data.id);
  check("16. teacher sees progress", (tprog.data ?? []).some((r) => r.completed), tprog.error?.message ?? "");
  const tatt = await T.client.from("exam_attempts").select("percent").eq("exam_id", ex.data.id);
  check("teacher sees attempt result", (tatt.data ?? []).some((r) => r.percent === 100), tatt.error?.message ?? "");

  // §95 isolation: second student cannot see first student's progress
  const S2 = await tempUser("student");
  trash.users.push(S2.id);
  const iso = await S2.client.from("lesson_progress").select("lesson_id").eq("lesson_id", l.data.id);
  check("§95 student B cannot see student A progress", (iso.data ?? []).length === 0, iso.error?.message ?? "");
} catch (e) {
  fail++;
  console.log("FAIL exception: " + e.message);
}

// cleanup: ONLY temp rows by collected IDs (service role bypasses RLS)
if (trash.attempts.length > 0) {
  await svc.from("exam_answers").delete().in("attempt_id", trash.attempts);
  await svc.from("exam_attempts").delete().in("id", trash.attempts);
}
if (trash.exams.length > 0) {
  await svc.from("exam_questions").delete().in("exam_id", trash.exams);
  await svc.from("exams").delete().in("id", trash.exams);
}
if (trash.lessons.length > 0) {
  await svc.from("lesson_progress").delete().in("lesson_id", trash.lessons);
  await svc.from("video_progress").delete().in("lesson_id", trash.lessons);
  await svc.from("lessons").delete().in("id", trash.lessons);
}
for (const cid of trash.courses) {
  await svc.from("enrollments").delete().eq("course_id", cid);
  await svc.from("course_modules").delete().eq("course_id", cid);
  await svc.from("courses").delete().eq("id", cid);
}
for (const qid of trash.questions) {
  await svc.from("question_options").delete().eq("question_id", qid);
  await svc.from("questions").delete().eq("id", qid);
}
for (const uid of trash.users) await svc.auth.admin.deleteUser(uid);

console.log(`\nACCEPTANCE-V1: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
