import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronUp, ChevronDown, Trash2, Plus, Eye, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  updateCourse, setCourseStatus, uploadThumbnail,
  addModule, renameModule, deleteModule, moveModule,
  addLesson, updateLesson, deleteLesson, moveLesson,
} from "@/app/actions/teacher";
import { PageHeader, Badge, fieldCls } from "@/components/ui/ui";

type Module = {
  id: string; title_ar: string; order_num: number;
  lessons: { id: string; title_ar: string; order_num: number; youtube_video_id: string | null; is_free: boolean; status: string }[];
};

const statusLabel: Record<string, string> = { draft: "مسودة", review: "مراجعة", published: "منشور", archived: "مؤرشف" };

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  if (!teacher) redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("id,title_ar,slug,description_ar,thumbnail_url,price,status,subject_id,grade_id")
    .eq("id", id)
    .eq("teacher_id", teacher.id)
    .single();
  if (!course) redirect("/dashboard/teacher");

  const [{ data: modules }, { data: subjects }, { data: grades }, { data: ytChannels }] = await Promise.all([
    supabase.from("course_modules").select("id,title_ar,order_num,lessons(id,title_ar,order_num,youtube_video_id,is_free,status)")
      .eq("course_id", id).order("order_num", { ascending: true }),
    supabase.from("subjects").select("id,title_ar").eq("is_active", true).order("order_num").limit(100),
    supabase.from("grades").select("id,title_ar").eq("is_active", true).order("order_num").limit(30),
    supabase.from("youtube_channels").select("id,channel_id,title").eq("teacher_id", teacher.id),
  ]);

  const mods = ((modules ?? []) as Module[]).map((m) => ({
    ...m,
    lessons: [...(m.lessons ?? [])].sort((a, b) => a.order_num - b.order_num),
  }));

  const updateAction = updateCourse.bind(null, id);
  const thumbAction = uploadThumbnail.bind(null, id);

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="absolute top-10 left-10 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="mb-4 flex items-center gap-2 text-xs">
        <Link href="/dashboard/teacher" className="inline-flex items-center gap-1 font-bold text-muted hover:text-primary">
          لوحتي <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <Badge tone={course.status === "published" ? "success" : "muted"}>{statusLabel[course.status] ?? course.status}</Badge>
      </div>
      <PageHeader title={course.title_ar} description="محرر الكورس — البيانات والوحدات والدروس والنشر">
        {course.status === "published" ? (
          <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-primary/50 transition">
            <Eye className="h-4 w-4" /> عرض صفحة الكورس
          </Link>
        ) : null}
      </PageHeader>

      <section className="rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl">
        <h2 className="mb-4 font-black">البيانات الأساسية</h2>
        <form action={updateAction} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
            العنوان
            <input name="title_ar" required defaultValue={course.title_ar} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            المادة
            <select name="subject_id" defaultValue={course.subject_id ?? ""} className={fieldCls}>
              <option value="">بدون</option>
              {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.title_ar}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            الصف
            <select name="grade_id" defaultValue={course.grade_id ?? ""} className={fieldCls}>
              <option value="">بدون</option>
              {(grades ?? []).map((g) => <option key={g.id} value={g.id}>{g.title_ar}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
            الوصف
            <textarea name="description_ar" rows={3} defaultValue={course.description_ar ?? ""} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            السعر
            <input name="price" type="number" min={0} dir="ltr" defaultValue={course.price ?? 0} className={fieldCls} />
          </label>
          <div className="flex items-end">
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold hover:border-primary/50 transition">
              <Save className="h-4 w-4" /> حفظ
            </button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background/60 p-4">
          <form action={thumbAction} className="flex flex-wrap items-center gap-2 text-sm">
            <input type="file" name="file" accept="image/*" required className="text-xs" />
            <button type="submit" className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold hover:border-primary/50 transition">رفع الغلاف</button>
          </form>
          {course.thumbnail_url ? <span className="text-xs font-bold text-success">يوجد غلاف مرفوع ✓</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">الحالة:</span>
          {(["draft", "review", "published", "archived"] as const).map((s) => (
            <form key={s} action={setCourseStatus.bind(null, id, s)}>
              <button type="submit" disabled={course.status === s}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 hover:border-primary/50 transition">
                {statusLabel[s]}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border/80 bg-surface/85 p-6 backdrop-blur-xl">
        <h2 className="mb-4 font-black">الوحدات والدروس</h2>
        <form action={addModule.bind(null, id)} className="mb-5 flex gap-2">
          <input name="title_ar" required placeholder="عنوان وحدة جديدة" className={fieldCls + " flex-1"} />
          <button type="submit" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" /> وحدة
          </button>
        </form>
        {mods.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">لا توجد وحدات بعد.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {mods.map((m, mi) => (
              <div key={m.id} className="overflow-hidden rounded-2xl border border-border">
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/60 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">{mi + 1}</span>
                  <form action={renameModule.bind(null, m.id, id)} className="flex min-w-0 flex-1 gap-2">
                    <input name="title_ar" defaultValue={m.title_ar} required
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-bold outline-none transition focus:border-primary focus:bg-background" />
                    <button type="submit" className="shrink-0 text-xs font-bold text-primary hover:underline">حفظ</button>
                  </form>
                  <form action={moveModule.bind(null, m.id, id, "up")}><button className="rounded-lg border border-border p-1.5 hover:border-primary/50 transition" title="أعلى"><ChevronUp className="h-4 w-4" /></button></form>
                  <form action={moveModule.bind(null, m.id, id, "down")}><button className="rounded-lg border border-border p-1.5 hover:border-primary/50 transition" title="أسفل"><ChevronDown className="h-4 w-4" /></button></form>
                  <form action={deleteModule.bind(null, m.id, id)}>
                    <button className="rounded-lg border border-border p-1.5 text-danger hover:border-danger/50 transition" title="حذف الوحدة ودروسها"><Trash2 className="h-4 w-4" /></button>
                  </form>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {m.lessons.map((l) => (
                    <details key={l.id} className="group rounded-xl border border-border bg-background/50 px-4 py-3 text-sm open:bg-background">
                      <summary className="cursor-pointer font-bold marker:text-primary">
                        {l.title_ar}
                        <span className="mr-2 inline-flex gap-1.5 text-xs font-medium">
                          <Badge tone={l.status === "published" ? "success" : "muted"}>{l.status === "published" ? "منشور" : "مسودة"}</Badge>
                          {l.is_free ? <Badge tone="primary">مجاني</Badge> : null}
                        </span>
                      </summary>
                      <form action={updateLesson.bind(null, l.id, id)} className="mt-3 grid gap-2.5 md:grid-cols-2">
                        <input name="title_ar" defaultValue={l.title_ar} required className={fieldCls + " md:col-span-2"} />
                        <input name="youtube" dir="ltr" defaultValue={l.youtube_video_id ?? ""}
                          placeholder="YouTube ID أو رابط" className={fieldCls + " md:col-span-2"} />
                        <label className="flex items-center gap-2 text-xs font-bold">
                          <input type="checkbox" name="is_free" defaultChecked={l.is_free} className="accent-primary" /> مجاني
                        </label>
                        <select name="status" defaultValue={l.status} className={fieldCls + " !py-2 text-xs"}>
                          <option value="draft">مسودة</option>
                          <option value="published">منشور</option>
                          <option value="archived">مؤرشف</option>
                        </select>
                        <div className="flex gap-2 md:col-span-2">
                          <button type="submit" className="rounded-xl border border-border px-4 py-1.5 text-xs font-bold hover:border-primary/50 transition">حفظ</button>
                          <Link href={`/courses/${course.slug}/lessons/${l.id}`} className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-1.5 text-xs font-bold hover:border-primary/50 transition">
                            <Eye className="h-3.5 w-3.5" /> معاينة
                          </Link>
                        </div>
                      </form>
                      <div className="mt-2.5 flex gap-4 text-xs font-bold">
                        <form action={moveLesson.bind(null, l.id, m.id, id, "up")}><button className="text-muted hover:text-primary transition">أعلى</button></form>
                        <form action={moveLesson.bind(null, l.id, m.id, id, "down")}><button className="text-muted hover:text-primary transition">أسفل</button></form>
                        <form action={deleteLesson.bind(null, l.id, id)}><button className="text-danger hover:underline">حذف الدرس</button></form>
                      </div>
                    </details>
                  ))}
                  <form action={addLesson.bind(null, m.id, id)} className="mt-1 grid gap-2.5 rounded-2xl border-2 border-dashed border-border bg-surface-2/40 p-3 md:grid-cols-2">
                    <input name="title_ar" required placeholder="عنوان درس جديد" className={fieldCls + " text-sm md:col-span-2"} />
                    <input name="youtube" dir="ltr" placeholder="YouTube ID أو رابط (اختياري)" className={fieldCls + " text-sm md:col-span-2"} />
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" name="is_free" className="accent-primary" /> مجاني
                    </label>
                    <select name="status" className={fieldCls + " !py-2 text-xs"}>
                      <option value="draft">مسودة</option>
                      <option value="published">منشور</option>
                    </select>
                    <button type="submit" className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow hover:opacity-95 transition md:col-span-2">+ إضافة الدرس</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
        {(ytChannels ?? []).length > 0 ? (
          <p className="mt-4 text-xs text-muted">
            عندك قنوات مربوطة — حوّل فيديوهاتها لدروس من صفحة <Link href="/dashboard/teacher/youtube" className="font-bold text-primary underline">يوتيوب</Link>.
          </p>
        ) : null}
      </section>
    </div>
  );
}
