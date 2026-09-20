import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";

export function BrandLoader({
  label = "نتعلم • نتقدم • نصل",
  subtitle = "جاري تهيئة مسارك التعليمي المخصص...",
  fullScreen = false,
}: {
  label?: string;
  subtitle?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 px-4 select-none relative",
        fullScreen ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl" : "flex-1 py-20"
      )}
    >
      {/* Background Ambient Glows */}
      <div className="absolute w-72 h-72 rounded-full bg-primary/15 blur-3xl -z-10 animate-pulse-glow" />
      <div className="absolute w-60 h-60 rounded-full bg-secondary/10 blur-3xl -z-10" />

      {/* Orbiting Ring & Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer Rotating Gradient Ring */}
        <div className="absolute -inset-4 rounded-full border border-primary/20 border-t-primary border-r-secondary animate-spin-slow" />
        <div className="absolute -inset-2 rounded-full border border-secondary/10 border-b-accent animate-spin-slow [animation-direction:reverse] [animation-duration:12s]" />

        {/* Pulsing Core */}
        <div className="relative p-3 rounded-2xl bg-surface/80 dark:bg-surface/40 backdrop-blur-lg border border-border shadow-2xl shadow-primary/10">
          <BrandLogo size="lg" showText={false} href="" />
        </div>
      </div>

      {/* Text Info */}
      <div className="flex flex-col items-center gap-2 text-center mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-foreground">
            خُـطَـى
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            KHOTA
          </span>
        </div>
        <p className="text-sm font-semibold text-primary/90">{label}</p>
        <p className="text-xs text-muted max-w-xs">{subtitle}</p>
      </div>

      {/* Modern High-End Progress Bar */}
      <div className="w-56 h-1.5 rounded-full bg-surface-raised border border-border overflow-hidden relative" dir="ltr">
        <div className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-primary via-secondary to-accent rounded-full animate-pulse shimmer-effect" />
      </div>
    </div>
  );
}
