// Reads .env.local (never prints secrets), checks Supabase reachable + tables exist.
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
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("MISSING_ENV");
  process.exit(1);
}

const supabase = createClient(url, anon);
const tables = ["subjects", "courses", "profiles", "grades", "tracks"];

let ok = true;
for (const t of tables) {
  const { error } = await supabase.from(t).select("id").limit(1);
  if (error) {
    console.log(`${t}: MISSING_OR_NO_ACCESS (${error.code} ${error.message})`);
    ok = false;
  } else {
    console.log(`${t}: OK`);
  }
}
process.exit(ok ? 0 : 2);
