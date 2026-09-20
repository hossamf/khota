"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
      setMsg("تم إرسال رابط التأكيد إن كان الإيميل مسجلاً وغير مؤكد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="absolute top-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative w-full rounded-3xl border border-border/80 bg-surface/85 p-8 backdrop-blur-2xl shadow-2xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-black">تحقق من بريدك</h1>
        <p className="mt-2 text-sm text-muted">
          أرسلنا رابط تأكيد إلى بريدك. اضغط عليه ثم أكمل بياناتك من صفحة التهيئة.
        </p>
        <form onSubmit={resend} className="mt-5 flex gap-2">
          <input
            type="email"
            required
            dir="ltr"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:border-primary/50 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إعادة الإرسال
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {msg ? <p className="mt-3 text-sm text-success">{msg}</p> : null}
        <Link href="/onboarding" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all">
          متابعة إلى التهيئة
        </Link>
      </div>
    </div>
  );
}
