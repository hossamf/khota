import Link from "next/link";
import { BadgeCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, Badge } from "@/components/ui/ui";

export default async function TeacherPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id,bio_ar,is_verified,profiles!inner(full_name)")
    .eq("username", username.toLowerCase())
    .single();

  if (!teacher) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState title="المدرس غير موجود" description="تأكد من الرابط." actionHref="/courses" actionLabel="تصفح الكورسات" />
      </div>
    );
  }

  const t = teacher as unknown as {
    id: string; bio_ar: string | null; is_verified: boolean;
    profiles: { full_name: string | null } | { full_name: string | null }[];
  };
  const name = Array.isArray(t.profiles) ? t.profiles[0]?.full_name : t.profiles?.full_name;

  const [{ data: chs }, { data: tCourses }] = await Promise.all([
    supabase.from("youtube_channels").select("id").eq("teacher_id", t.id),
    supabase.from("courses").select("id").eq("teacher_id", t.id),
  ]);
  const channelIds = (chs ?? []).map((c) => c.id);
  const courseIds = (tCourses ?? []).map((c) => c.id);

  const [{ data: courses }, { data: videos }, { count: studentCount }] = await Promise.all([
    supabase.from("courses").select("id,title_ar,slug,description_ar")
      .eq("teacher_id", t.id).eq("status", "published").limit(12),
    channelIds.length > 0
      ? supabase.from("youtube_videos").select("video_id,title,thumbnail_url")
          .in("channel_id", channelIds).order("published_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),
    courseIds.length > 0
      ? supabase.from("enrollments").select("student_id", { count: "exact", head: true }).in("course_id", courseIds)
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute top-10 right-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl">
        <div className="relative bg-gradient-to-bl from-indigo-950 via-slate-900 to-slate-950 p-8 md:p-10">
          <div className="absolute inset-0 bg-radial-glow opacity-50" />
          <div className="relative flex flex-wrap items-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-brand text-3xl font-black text-white shadow-xl">
              {(name ?? "م").slice(0, 1)}
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black text-white">
                {name ?? "مدرس"}
                {t.is_verified ? <BadgeCheck className="h-6 w-6 text-secondary" /> : null}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <Badge tone={t.is_verified ? "success" : "muted"}>{t.is_verified ? "موثق ✓" : "مدرس بالمنصة"}</Badge>
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {studentCount ?? 0} مشترك</span>
              </div>
            </div>
          </div>
          {t.bio_ar ? <p className="relative mt-4 max-w-2xl text-slate-300">{t.bio_ar}</p> : null}
        </div>
      </div>

      <div className="mt-8">
        <PageHeader title="الكورسات" description="الكورسات المنشورة لهذا المدرس" />
      </div>
      {(courses ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center text-sm text-muted">لا توجد كورسات منشورة بعد.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(courses ?? []).map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group rounded-3xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
              <div className="font-bold group-hover:text-primary transition">{c.title_ar}</div>
              {c.description_ar ? <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description_ar}</p> : null}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <PageHeader title="أحدث الفيديوهات" description="من قناة المدرس على يوتيوب" />
      </div>
      {(videos ?? []).length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center text-sm text-muted">لا توجد فيديوهات مسحوبة بعد.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {(videos ?? []).map((v) => (
            <a key={v.video_id} href={`https://www.youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noreferrer"
              className="group overflow-hidden rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-danger/40 hover:shadow-xl">
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" className="h-40 w-full object-cover transition group-hover:scale-[1.03]" />
              ) : null}
              <div className="line-clamp-2 p-4 text-sm font-bold group-hover:text-primary transition">{v.title}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
