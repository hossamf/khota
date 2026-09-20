import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Brand mark: ascending steps forming a path to the peak. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-brand flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg",
        className
      )}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 19h4v-4h4V9h4V4h4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="19" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-black">{brand.name}</span>
          <span className="text-[11px] text-muted">{brand.tagline}</span>
        </span>
      ) : null}
    </span>
  );
}
