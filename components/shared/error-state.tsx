"use client";

export function ErrorState({
  title = "تعذر التحميل",
  description = "حدث خطأ أثناء جلب البيانات الحقيقية.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 border-danger/40 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-2xl">
        ⚠️
      </div>
      <div className="text-lg font-black">{title}</div>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {onRetry ? (
        <button onClick={onRetry} className="btn btn-ghost mt-2 !text-sm">
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
