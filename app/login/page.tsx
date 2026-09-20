"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("البريد الإلكتروني غير مؤكد بعد. يرجى مراجعة بريدك أو تأكيده من لوحة التحكم.");
        }
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.");
        }
        throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Glass Card Container */}
        <div className="rounded-3xl border border-border/80 bg-surface/85 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <BrandLogo size="lg" />
            <h1 className="mt-5 text-2xl font-black text-foreground tracking-tight">
              تسجيل الدخول
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted">
              أهلاً بعودتك! تابع مسارك التعليمي وانطلق نحو هدفك
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-danger/25 bg-danger/10 p-3.5 text-xs text-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            ) : null}

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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  كلمة المرور
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 px-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>دخول إلى حسابي</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-border/60 text-center text-xs text-muted">
            <span>ليس لديك حساب على خُطى بعد؟ </span>
            <Link
              href="/register"
              className="font-bold text-primary hover:underline mr-1"
            >
              إنشاء حساب جديد مجاناً
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
