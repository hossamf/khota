import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Routes the user to their real role dashboard. No fake session. */
export default async function DashboardRouter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  redirect(`/dashboard/${profile.role}`);
}
