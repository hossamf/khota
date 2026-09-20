import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotifBell, type Notif } from "./notif-bell";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  ArrowLeft,
  FileCheck,
  Home,
  Compass,
} from "lucide-react";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifs: Notif[] = [];
  let unread = 0;
  let profileRole: string | null = null;
  let profileName: string | null = null;

  if (user) {
    const [{ data: notifData }, { data: profile }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id,type,title_ar,body_ar,link,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("profiles")
        .select("role,full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    notifs = (notifData ?? []) as Notif[];
    unread = notifs.filter((n) => !n.is_read).length;
    profileRole = profile?.role ?? null;
    profileName = profile?.full_name ?? null;
  }

  const roleLabelMap: Record<string, string> = {
    student: "طالب",
    teacher: "معلم",
    parent: "ولي أمر",
    admin: "إدارة",
  };

  return (
    <header className="sticky top-3.5 z-50 w-full px-3 sm:px-6 pointer-events-none">
      {/* Floating Glass Capsule */}
      <div className="pointer-events-auto mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 rounded-full border border-border/80 bg-surface/85 dark:bg-slate-950/80 backdrop-blur-2xl px-4 sm:px-6 shadow-xl shadow-black/5 transition-all">
        
        {/* Brand Logo */}
        <BrandLogo size="sm" />

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden items-center gap-1 text-xs sm:text-sm font-semibold md:flex">
          <Link
            href="/subjects"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-muted hover:text-foreground hover:bg-surface-raised transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>المواد الدراسية</span>
          </Link>

          <Link
            href="/courses"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-muted hover:text-foreground hover:bg-surface-raised transition-all"
          >
            <GraduationCap className="w-3.5 h-3.5 text-secondary" />
            <span>الكورسات</span>
          </Link>

          <Link
            href="/exams"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-muted hover:text-foreground hover:bg-surface-raised transition-all"
          >
            <FileCheck className="w-3.5 h-3.5 text-accent" />
            <span>الاختبارات</span>
          </Link>

          <Link
            href="/#roadmap"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-muted hover:text-foreground hover:bg-surface-raised transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>المسار</span>
          </Link>
        </nav>

        {/* Right Side: Theme Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <NotifBell initial={notifs} unread={unread} />
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
                {profileRole && (
                  <span className="hidden sm:inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                    {profileName ? profileName.split(" ")[0] : (roleLabelMap[profileRole] || profileRole)}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-border/80 bg-surface/70 px-4 py-1.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-raised active:scale-95 transition-all"
              >
                دخول
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all"
              >
                <span>ابدأ مجاناً</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Mobile Dock / Bottom Navigation */}
      <div className="fixed bottom-4 inset-x-4 z-50 pointer-events-auto md:hidden">
        <nav className="mx-auto flex max-w-md items-center justify-around rounded-full border border-border/80 bg-surface/90 dark:bg-slate-950/90 backdrop-blur-2xl py-3 px-2 shadow-2xl text-xs font-semibold">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">الرئيسية</span>
          </Link>
          <Link
            href="/subjects"
            className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px]">المواد</span>
          </Link>
          <Link
            href="/courses"
            className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[10px]">الكورسات</span>
          </Link>
          <Link
            href="/exams"
            className="flex flex-col items-center gap-1 text-muted hover:text-primary transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span className="text-[10px]">الاختبارات</span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex flex-col items-center gap-1 text-primary font-bold transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">{user ? "لوحتي" : "حسابي"}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
