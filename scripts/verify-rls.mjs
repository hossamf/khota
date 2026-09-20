// RLS allow/deny verification with throwaway users (created + deleted here).
// Run: node scripts/verify-rls.mjs
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
// NOTE: `pub` is never used to sign in (sign-ins use `signer`), so it stays truly anonymous.
const pub = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const signer = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

async function makeUser(role) {
  const email = `tmp-rls-${role}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password: "TmpPass123!",
    email_confirm: true,
    user_metadata: { role, full_name: "RLS" },
  });
  if (error) throw new Error("createUser: " + error.message);
  const s = await signer.auth.signInWithPassword({ email, password: "TmpPass123!" });
  const token = s.data.session.access_token;
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { id: data.user.id, client };
}

const student = await makeUser("student");
const teacherA = await makeUser("teacher");
const teacherB = await makeUser("teacher");

// Setup: teacher A owns a draft course (service role bypasses RLS)
const { data: tA } = await svc.from("teachers").select("id").eq("profile_id", teacherA.id).single();
const { data: draft } = await svc
  .from("courses")
  .insert({ teacher_id: tA.id, title_ar: "RLS draft", slug: "rls-draft-" + Date.now(), status: "draft" })
  .select("id")
  .single();

// 1. anon cannot list profiles
{
  const r = await pub.from("profiles").select("id").limit(1);
  check("anon cannot read profiles", (r.data ?? []).length === 0, r.error?.message ?? "");
}
// 2. student cannot see draft course
{
  const r = await student.client.from("courses").select("id").eq("id", draft.id);
  check("student cannot read draft course", (r.data ?? []).length === 0, r.error?.message ?? "");
}
// 3. teacher B cannot see teacher A draft
{
  const r = await teacherB.client.from("courses").select("id").eq("id", draft.id);
  check("teacher B cannot read teacher A draft", (r.data ?? []).length === 0, r.error?.message ?? "");
}
// 4. teacher A CAN see own draft
{
  const r = await teacherA.client.from("courses").select("id").eq("id", draft.id);
  check("teacher A reads own draft", (r.data ?? []).length === 1, r.error?.message ?? "");
}
// 5. student cannot update teacher A course
{
  const r = await student.client.from("courses").update({ title_ar: "hacked" }).eq("id", draft.id).select("id");
  check("student cannot update course", (r.data ?? []).length === 0, r.error?.message ?? "");
}
// 6. student reads own profile (no recursion error)
{
  const r = await student.client.from("profiles").select("id,role").eq("id", student.id).single();
  check("student reads own profile", r.data?.role === "student", r.error?.message ?? "");
}
// 7. student cannot insert question for others (created_by enforced by self)
{
  const r = await student.client
    .from("questions")
    .insert({ question_ar: "x", type: "mcq", created_by: teacherA.id })
    .select("id");
  // RLS: questions_write requires created_by = auth.uid() -> denied
  check("student cannot create question as teacher", (r.data ?? []).length === 0, r.error?.message ?? "");
}

// Cleanup
await svc.from("courses").delete().eq("id", draft.id);
await svc.auth.admin.deleteUser(student.id);
await svc.auth.admin.deleteUser(teacherA.id);
await svc.auth.admin.deleteUser(teacherB.id);

console.log(`\nRLS: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
