"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  GraduationCap,
  Video,
  Users,
} from "lucide-react";

type Role = "student" | "teacher" | "parent";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
      // If email confirmation is OFF, Supabase returns a session immediately.
      if (data.session) router.push("/onboarding");
      else router.push("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    {
      id: "student" as Role,
      label: "طالب",
      desc: "مسارات ودروس وامتحانات",
      icon: GraduationCap,
    },
    {
      id: "teacher" as Role,
      label: "معلم",
      desc: "نشر كورسات وفيديوهات",
      icon: Video,
    },
    {
      id: "parent" as Role,
      label: "ولي أمر",
      desc: "متابعة أداء الأبناء",
      icon: Users,
    },
  ];

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Glass Card */}
        <div className="rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <BrandLogo size="lg" />
            <h1 className="mt-5 text-2xl font-black text-foreground tracking-tight">
              إنشاء حساب جديد
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted">
              انضم لمنظومة خُطى التعليمية وابدأ رحلتك الآن مجاناً
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-danger/25 bg-danger/10 p-3.5 text-xs text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            ) : null}

            {/* Role Selection Segmented Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground">
                اختر نوع الحساب
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                          : "border-border/80 bg-surface text-muted hover:bg-surface-raised hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-primary" : "text-muted"}`} />
                      <span className="text-xs font-bold leading-none">{r.label}</span>
                      <span className="text-[9px] text-muted mt-1 line-clamp-1">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                الاسم الكامل
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  placeholder="مثال: أحمد محمد علي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all text-left"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                كلمة المرور (6 أحرف على الأقل)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type="password"
                  minLength={6}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all text-left"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إنشاء الحساب...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الحساب والانطلاق</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-border/60 text-center text-xs text-muted">
            <span>لديك حساب بالفعل؟ </span>
            <Link
              href="/login"
              className="font-bold text-primary hover:underline mr-1"
            >
              تسجيل الدخول هنا
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
