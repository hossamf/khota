import { Users, GraduationCap, BookOpen, Clock, TrendingUp, LogOut } from "lucide-react";
import { guard, signOut } from "../guard";
import { PageHeader, Card, Badge } from "@/components/ui/ui";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function getAdminClient() {
  try {
    return createServiceClient();
  } catch {
    return await createClient();
  }
}

interface ChildStudent {
  id: string;
  profile_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  grades: {
    id: string;
    title_ar: string;
  } | null;
}

interface ParentChildLink {
  student_id: string;
  students: ChildStudent | null;
}

interface CourseEnrollment {
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  courses: {
    id: string;
    title_ar: string;
    thumbnail_url: string | null;
  } | null;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  percent: number;
  correct_count: number;
  wrong_count: number;
  status: string;
  started_at: string;
  submitted_at: string | null;
  exams: {
    id: string;
    title_ar: string;
    total_marks: number;
    pass_percent: number;
  } | null;
}

interface ChildDashboardData {
  studentId: string;
  name: string;
  grade: string | null;
  avatarUrl: string | null;
  courses: CourseEnrollment[];
  recentAttempts: ExamAttempt[];
  averageScore: number | null;
  completedCoursesCount: number;
}

export default async function ParentDashboard() {
  const { supabase, user, profile } = await guard("parent");
  const adminClient = await getAdminClient();

  // 1. Fetch parent record
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  // 2. Fetch linked children (IDs via RLS-scoped user client = authorization)
  const { data: childLinks } = parent
    ? await supabase
        .from("parent_children")
        .select("student_id")
        .eq("parent_id", parent.id)
    : { data: [] };

  const linkedIds = ((childLinks ?? []) as { student_id: string }[]).map((r) => r.student_id);

  // 3. Child details via scoped read (only linked IDs — no IDOR)
  const { data: studentsData } = linkedIds.length > 0
    ? await adminClient
        .from("students")
        .select("id,profile_id,profiles(full_name,avatar_url),grades(id,title_ar)")
        .in("id", linkedIds)
    : { data: [] };

  const rawLinks = ((studentsData ?? []) as unknown as ChildStudent[]).map((s) => ({
    student_id: s.id,
    students: s,
  })) as ParentChildLink[];

  // 3. For each child, fetch real enrollments and exam attempts
  const childrenData: ChildDashboardData[] = await Promise.all(
    rawLinks.map(async (link) => {
      const studentId = link.student_id;
      const student = link.students;
      const studentName = student?.profiles?.full_name || `طالب (${studentId.slice(0, 6)})`;
      const grade = student?.grades?.title_ar || null;
      const avatarUrl = student?.profiles?.avatar_url || null;

      // Real courses for this child
      const { data: rawEnrollments } = await adminClient
        .from("enrollments")
        .select(`
          course_id,
          progress_percent,
          enrolled_at,
          courses (
            id,
            title_ar,
            thumbnail_url
          )
        `)
        .eq("student_id", studentId)
        .order("enrolled_at", { ascending: false });

      const courses = (rawEnrollments || []) as unknown as CourseEnrollment[];

      // Last 5 exam attempts for this child
      const { data: rawAttempts } = await adminClient
        .from("exam_attempts")
        .select(`
          id,
          exam_id,
          score,
          percent,
          correct_count,
          wrong_count,
          status,
          started_at,
          submitted_at,
          exams (
            id,
            title_ar,
            total_marks,
            pass_percent
          )
        `)
        .eq("student_id", studentId)
        .in("status", ["submitted", "graded"])
        .order("submitted_at", { ascending: false })
        .limit(5);

      const recentAttempts = (rawAttempts || []) as unknown as ExamAttempt[];

      // All graded attempts to compute true average score
      const { data: allGraded } = await adminClient
        .from("exam_attempts")
        .select("percent")
        .eq("student_id", studentId)
        .in("status", ["submitted", "graded"]);

      const averageScore =
        allGraded && allGraded.length > 0
          ? Math.round(
              allGraded.reduce((sum, item) => sum + (Number(item.percent) || 0), 0) /
                allGraded.length
            )
          : null;

      const completedCoursesCount = courses.filter(
        (c) => (Number(c.progress_percent) || 0) >= 100
      ).length;

      return {
        studentId,
        name: studentName,
        grade,
        avatarUrl,
        courses,
        recentAttempts,
        averageScore,
        completedCoursesCount,
      };
    })
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" dir="rtl">
      {/* Page Header */}
      <PageHeader
        title={`متابعة الأبناء — ${profile.full_name ?? "ولي الأمر"}`}
        description="تقارير دقيقة ومباشرة لتقدم أبنائك الدراسي ونتائج اختباراتهم"
      >
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold transition hover:border-danger/50 hover:text-danger cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </form>
      </PageHeader>

      {/* Case 1: Empty state when no children linked */}
      {childrenData.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-border/80">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-foreground">لا يوجد أبناء مرتبطون بعد</h2>
          <p className="mt-2 text-sm text-muted max-w-md leading-relaxed">
            يتم ربط حسابات الأبناء بحساب ولي الأمر من خلال لوحة إدارة النظام. إذا كنت بحاجة للمساعدة، يرجى التواصل مع إدارة المدرسة أو الدعم الفني للمنصة.
          </p>
        </Card>
      ) : (
        /* Children Cards */
        <div className="space-y-10">
          {childrenData.map((child) => (
            <div
              key={child.studentId}
              className="rounded-3xl border border-border/80 bg-surface/85 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-6"
            >
              {/* Child Header Profile & Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/70">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white font-black text-xl shadow-md">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">
                      {child.name}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      {child.grade ? (
                        <Badge tone="primary">
                          <GraduationCap className="h-3 w-3 inline ml-1" />
                          {child.grade}
                        </Badge>
                      ) : (
                        <Badge tone="muted">طالب منتظم</Badge>
                      )}
                      <span className="text-xs text-muted font-mono">
                        #{child.studentId.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/80 bg-surface px-4 py-3 text-right">
                    <span className="text-xs text-muted block">المعدل العام</span>
                    <span className="text-xl font-black text-foreground">
                      {child.averageScore !== null ? `${child.averageScore}%` : "—"}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-surface px-4 py-3 text-right">
                    <span className="text-xs text-muted block">المقررات</span>
                    <span className="text-xl font-black text-foreground">
                      {child.courses.length}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-surface px-4 py-3 text-right col-span-2 sm:col-span-1">
                    <span className="text-xs text-muted block">مكتمل</span>
                    <span className="text-xl font-black text-success">
                      {child.completedCoursesCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Courses & Progress */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    المقررات الدراسية ونسبة الإنجاز
                  </h3>
                  <span className="text-xs text-muted">
                    {child.courses.length} مقرر
                  </span>
                </div>

                {/* Empty state for courses */}
                {child.courses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center bg-surface-2/40">
                    <BookOpen className="h-7 w-7 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-muted">لا يوجد مقررات مسجلة لهذا الابن بعد</p>
                    <p className="text-xs text-muted mt-1">عند تسجيل الطالب في أي كورس تعليمي، ستظهر نسبة إنجازه هنا تلقائياً.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {child.courses.map((enr) => {
                      const percent = Math.min(100, Math.max(0, Number(enr.progress_percent) || 0));
                      const isComplete = percent >= 100;
                      return (
                        <div
                          key={enr.course_id}
                          className="rounded-2xl border border-border/70 bg-surface p-4 transition hover:border-primary/40"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">
                              {enr.courses?.title_ar || "مقرر دراسي"}
                            </h4>
                            {isComplete ? (
                              <Badge tone="success" className="shrink-0">
                                مكتمل
                              </Badge>
                            ) : (
                              <span className="text-xs font-bold text-primary shrink-0">
                                {percent}%
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isComplete ? "bg-success" : "bg-primary"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Last 5 Exam Attempts */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    آخر 5 محاولات اختبارات
                  </h3>
                  <span className="text-xs text-muted">سجل الأداء والتقييم</span>
                </div>

                {/* Empty state for exam attempts */}
                {child.recentAttempts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center bg-surface-2/40">
                    <Clock className="h-7 w-7 text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-muted">لم يقم الطالب بإجراء أي اختبارات بعد</p>
                    <p className="text-xs text-muted mt-1">ستُدرج نتائج الاختبارات والتقييمات التفصيلية هنا فور إتمام الطالب لأي اختبار.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/70 bg-surface">
                    <table className="w-full text-right text-sm">
                      <thead className="border-b border-border/70 bg-surface-2/60 text-xs text-muted font-bold">
                        <tr>
                          <th className="py-3 px-4">اسم الامتحان</th>
                          <th className="py-3 px-4">تاريخ الإجراء</th>
                          <th className="py-3 px-4 text-center">الدرجة</th>
                          <th className="py-3 px-4 text-center">النسبة</th>
                          <th className="py-3 px-4 text-center">النتيجة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {child.recentAttempts.map((attempt) => {
                          const percent = Number(attempt.percent) || 0;
                          const passPercent = Number(attempt.exams?.pass_percent) || 50;
                          const isPassed = percent >= passPercent;
                          const formattedDate = attempt.submitted_at
                            ? new Intl.DateTimeFormat("ar-EG", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }).format(new Date(attempt.submitted_at))
                            : "—";

                          return (
                            <tr key={attempt.id} className="hover:bg-surface-2/40 transition">
                              <td className="py-3.5 px-4 font-bold text-foreground">
                                {attempt.exams?.title_ar || "اختبار تدريبي"}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-muted font-mono">
                                {formattedDate}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-foreground">
                                {attempt.score}{" "}
                                <span className="text-xs text-muted">
                                  / {attempt.exams?.total_marks || "—"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-black">
                                <span
                                  className={isPassed ? "text-success" : "text-danger"}
                                >
                                  {percent}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {isPassed ? (
                                  <Badge tone="success">اجتياز</Badge>
                                ) : (
                                  <Badge tone="accent">يحتاج مراجعة</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
