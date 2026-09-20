import Link from "next/link";
import { FolderOpen, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon = FolderOpen,
  className,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden flex flex-col items-center justify-center text-center p-10 md:p-14 rounded-2xl border border-border/80 bg-surface/60 backdrop-blur-md shadow-sm transition-all",
        className
      )}
    >
      {/* Background Soft Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />

      {/* Floating Icon Orb */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/15 via-secondary/10 to-primary/5 text-primary border border-primary/20 shadow-inner">
        <Icon className="h-8 w-8 transition-transform group-hover:scale-110" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">{description}</p>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary-hover active:scale-[0.98] transition-all"
        >
          <span>{actionLabel}</span>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
