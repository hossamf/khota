import { redirect } from "next/navigation";
import { Youtube, RefreshCw, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { connectChannel, syncChannel } from "@/app/actions/teacher";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";

export default async function YouTubePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const [{ data: channels }, { data: courses }] = await Promise.all([
    supabase.from("youtube_channels")
      .select("id,channel_id,title,connected_at,youtube_videos(id,video_id,title,thumbnail_url,published_at,lesson_id)")
      .eq("teacher_id", teacher.id),
    supabase.from("courses")
      .select("id,title_ar,course_modules(id,title_ar)")
      .eq("teacher_id", teacher.id).eq("status", "published")
      .limit(20),
  ]);

  const mods = (courses ?? []).flatMap((c: { id: string; title_ar: string; course_modules: { id: string; title_ar: string }[] }) =>
    (c.course_modules ?? []).map((m) => ({ ...m, course: c.title_ar, courseId: c.id }))
  );

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-danger/10 blur-3xl pointer-events-none" />
      <PageHeader title="تكامل يوتيوب" description="اربط قناتك وزامن فيديوهاتها كدروس" />

      <form action={connectChannel} className="mb-4 flex max-w-xl gap-2">
        <input name="channel_id" required dir="ltr" placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
          className={fieldCls + " flex-1"} />
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
          <Youtube className="h-4 w-4" /> ربط القناة
        </button>
      </form>
      <p className="mb-6 max-w-xl text-xs leading-relaxed text-muted">
        الصق معرف القناة (يبدأ بـ UC). المزامنة تجلب أحدث الفيديوهات عبر خلاصة القناة بدون مفتاح API،
        ثم تحوّل أي فيديو لدرس مسودة داخل وحدة من كورساتك.
      </p>

      {(channels ?? []).length === 0 ? (
        <p className="text-sm text-muted">لا توجد قنوات مربوطة بعد.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {(channels ?? []).map((ch: {
            id: string; channel_id: string; title: string | null;
            youtube_videos: { id: string; video_id: string; title: string | null; thumbnail_url: string | null; published_at: string | null; lesson_id: string | null }[];
          }) => (
            <div key={ch.id} className="rounded-3xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold" dir="ltr">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <Youtube className="h-4 w-4" />
                  </span>
                  {ch.title ?? ch.channel_id}
                  <Badge tone="primary">{ch.youtube_videos.length} فيديو</Badge>
                </div>
                <form action={async () => { "use server"; await syncChannel(ch.id); }}>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-primary/50 transition">
                    <RefreshCw className="h-4 w-4" /> مزامنة الفيديوهات
                  </button>
                </form>
              </div>
              {ch.youtube_videos.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">لا توجد فيديوهات مسحوبة — دوس مزامنة.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {ch.youtube_videos.map((v) => (
                    <div key={v.id} className="flex gap-3 rounded-2xl border border-border p-3 text-sm">
                      {v.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail_url} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="line-clamp-2 font-bold">{v.title}</div>
                        {v.lesson_id ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> تحوّل لدرس</span>
                        ) : mods.length === 0 ? (
                          <span className="text-xs text-muted">أنشئ كورساً ووحدة أولاً</span>
                        ) : null}
                        {!v.lesson_id && mods.length > 0 ? (
                          <VideoToLesson videoId={v.id} modules={mods} />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoToLesson({
  videoId,
  modules,
}: {
  videoId: string;
  modules: { id: string; title_ar: string; course: string; courseId: string }[];
}) {
  async function action(formData: FormData) {
    "use server";
    const sel = String(formData.get("target") || "");
    const [moduleId, courseId] = sel.split("|");
    if (!moduleId || !courseId) throw new Error("اختر الوحدة");
    const { lessonFromVideo } = await import("@/app/actions/teacher");
    await lessonFromVideo(videoId, moduleId, courseId);
  }
  return (
    <form action={action} className="flex gap-1.5">
      <select name="target" required defaultValue="" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-1.5 py-1.5 text-xs outline-none focus:border-primary">
        <option value="">اختر الوحدة...</option>
        {modules.map((m) => (
          <option key={m.id} value={`${m.id}|${m.courseId}`}>{m.course} / {m.title_ar}</option>
        ))}
      </select>
      <button type="submit" className="shrink-0 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-95 transition">→ درس</button>
    </form>
  );
}
