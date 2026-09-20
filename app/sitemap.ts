import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/subjects", "/courses", "/exams", "/login", "/register"].map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: new Date(),
  }));

  try {
    const supabase = await createClient();
    const [{ data: courses }, { data: teachers }] = await Promise.all([
      supabase.from("courses").select("slug,updated_at").eq("status", "published").limit(500),
      supabase.from("teachers").select("username").not("username", "is", null).limit(500),
    ]);
    const dynamic = [
      ...((courses ?? []).map((c) => ({
        url: `${base}/courses/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      }))),
      ...((teachers ?? [])
        .filter((t) => t.username)
        .map((t) => ({ url: `${base}/teachers/${t.username}`, lastModified: new Date() }))),
    ];
    return [...staticRoutes, ...dynamic];
  } catch {
    return staticRoutes;
  }
}
