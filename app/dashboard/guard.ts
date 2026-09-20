import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function guard(role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role,full_name").eq("id", user.id).single();
  if (!profile || profile.role !== role) redirect("/dashboard");
  return { supabase, user, profile };
}

export async function signOut() {
  "use server";
  const { createClient } = await import("@/lib/supabase/server");
  const { redirect } = await import("next/navigation");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export { guard };
