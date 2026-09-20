"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMsg("تم إرسال رابط الاستعادة إلى بريدك إن كان مسجلا.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative rounded-3xl border border-border/80 bg-surface/85 p-7 backdrop-blur-2xl shadow-2xl sm:p-9">
        <h1 className="text-2xl font-black tracking-tight">استعادة كلمة المرور</h1>
        <p className="mt-1.5 text-sm text-muted">سنرسل لك رابط الاستعادة على بريدك</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            البريد الإلكتروني
            <input required type="email" dir="ltr" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none transition focus:border-primary" />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {msg ? <p className="text-sm text-success">{msg}</p> : null}
          <button type="submit" disabled={loading}
            className="rounded-xl bg-gradient-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 transition-all">
            {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>
      </div>
    </div>
  );
}
