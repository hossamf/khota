import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
}

export function BrandLogo({
  className,
  size = "md",
  showText = true,
  href = "/",
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-lg", sub: "text-[9px]" },
    md: { icon: "w-10 h-10", text: "text-xl", sub: "text-[10px]" },
    lg: { icon: "w-12 h-12", text: "text-2xl", sub: "text-xs" },
    xl: { icon: "w-16 h-16", text: "text-3xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      {/* KHOTA Geometric 'Khaa' & Steps Mark */}
      <div className={cn("relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105", currentSize.icon)}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary to-secondary blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
        
        {/* Outer Icon Surface */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:to-indigo-950 p-[1.5px] shadow-lg shadow-indigo-500/10">
          <div className="w-full h-full rounded-[14px] bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-hidden">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4/5 h-4/5 transform -rotate-3"
            >
              <defs>
                <linearGradient id="khotaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="khotaDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* The Dot of 'خ' - Elevated Diamond Star */}
              <circle
                cx="31"
                cy="10"
                r="3.5"
                fill="url(#khotaDotGrad)"
                filter="url(#glow)"
              />

              {/* Ascending Steps forming the Body of 'خ' */}
              <path
                d="M12 18H36L26 27L34 37H20L13 28L21 21H12V18Z"
                fill="url(#khotaGrad1)"
              />

              {/* Dynamic Path Light Line */}
              <path
                d="M10 38L22 28L30 38"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-black tracking-tight text-foreground transition-colors group-hover:text-primary", currentSize.text)}>
              خُطَى
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              KHOTA
            </span>
          </div>
          <span className={cn("text-muted -mt-0.5 font-medium leading-none tracking-wide", currentSize.sub)}>
            منصة التعليم المتكاملة
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
