"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-black">تعذر تحميل الصفحة</h1>
      <p className="text-sm text-muted">حدث خطأ غير متوقع أثناء جلب البيانات.</p>
      <button onClick={reset} className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 transition-all">
        إعادة المحاولة
      </button>
    </div>
  );
}
