// Probe which migrations are applied, using behavior tests with temp users.
// Run: node scripts/probe-migrations.mjs
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
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function tempUser(role) {
  const email = `tmp-probe-${role}-${Date.now()}@example.com`;
  const { data, error } = await svc.auth.admin.createUser({
    email, password: "TmpPass123!", email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw new Error(error.message);
  const s = await createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    .auth.signInWithPassword({ email, password: "TmpPass123!" });
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${s.data.session.access_token}` } },
  });
  return { id: data.user.id, client, email };
}

const results = {};
const trash = { users: [], courses: [], questions: [], channels: [] };

// 0007: teacher can insert option on own question
try {
  const t = await tempUser("teacher");
  trash.users.push(t.id);
  const { data: q } = await t.client.from("questions")
    .insert({ question_ar: "probe?", type: "mcq", created_by: t.id })
    .select("id").single();
  trash.questions.push(q.id);
  const o = await t.client.from("question_options")
    .insert({ question_id: q.id, option_ar: "أ", is_correct: true }).select("id");
  results["0007 qopt_write"] = (o.data ?? []).length === 1 ? "APPLIED" : `MISSING (${o.error?.message ?? "denied"})`;
} catch (e) {
  results["0007 qopt_write"] = "MISSING (" + e.message + ")";
}

// 0006: anon reads videos of verified teacher
try {
  const t = await tempUser("teacher");
  trash.users.push(t.id);
  const { data: tr } = await svc.from("teachers").select("id").eq("profile_id", t.id).single();
  await svc.from("teachers").update({ is_verified: true }).eq("id", tr.id);
  const { data: ch } = await svc.from("youtube_channels")
    .insert({ teacher_id: tr.id, channel_id: "UC" + "x".repeat(22) }).select("id").single();
  trash.channels.push(ch.id);
  await svc.from("youtube_videos").insert({ channel_id: ch.id, video_id: "probe" + Date.now(), title: "p" });
  const r = await anon.from("youtube_videos").select("id").eq("channel_id", ch.id);
  results["0006 yt_videos_public"] = (r.data ?? []).length >= 1 ? "APPLIED" : `MISSING (${r.error?.message ?? "0 rows"})`;
} catch (e) {
  results["0006 yt_videos_public"] = "MISSING (" + e.message + ")";
}

// 0008: admin can insert audit log
try {
  const a = await tempUser("student");
  trash.users.push(a.id);
  await svc.from("profiles").update({ role: "admin" }).eq("id", a.id);
  const s2 = await createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    .auth.signInWithPassword({ email: a.email, password: "TmpPass123!" });
  const ac = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${s2.data.session.access_token}` } },
  });
  const r = await ac.from("audit_logs").insert({ actor_id: a.id, action: "probe", target_type: "t", target_id: "1" }).select("id");
  results["0008 audit_insert_admin"] = (r.data ?? []).length === 1 ? "APPLIED" : `MISSING (${r.error?.message ?? "denied"})`;
} catch (e) {
  results["0008 audit_insert_admin"] = "MISSING (" + e.message + ")";
}

// 0009: teacher can INSERT video into own channel
try {
  const t = await tempUser("teacher");
  const { data: tr } = await svc.from("teachers").select("id").eq("profile_id", t.id).single();
  const { data: ch } = await svc.from("youtube_channels")
    .insert({ teacher_id: tr.id, channel_id: "UC" + "y".repeat(22) }).select("id").single();
  const ins = await t.client.from("youtube_videos")
    .insert({ channel_id: ch.id, video_id: "probe9" + Date.now(), title: "p9" }).select("id");
  results["0009 yt_videos_write"] = (ins.data ?? []).length === 1 ? "APPLIED" : `MISSING (${ins.error?.message ?? "denied"})`;
  await svc.from("youtube_videos").delete().eq("channel_id", ch.id);
  await svc.from("youtube_channels").delete().eq("id", ch.id);
  await svc.auth.admin.deleteUser(t.id);
} catch (e) {
  results["0009 yt_videos_write"] = "MISSING (" + e.message + ")";
}

// cleanup
for (const cid of trash.channels) {
  await svc.from("youtube_videos").delete().eq("channel_id", cid);
  await svc.from("youtube_channels").delete().eq("id", cid);
}
for (const qid of trash.questions) await svc.from("questions").delete().eq("id", qid);
for (const uid of trash.users) await svc.auth.admin.deleteUser(uid);

console.log(JSON.stringify(results, null, 2));
