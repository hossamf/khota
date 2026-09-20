export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-6" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-border" />
      ))}
    </div>
  );
}
