import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-lg hover:opacity-90",
  outline: "border border-border bg-surface hover:border-primary",
  ghost: "hover:bg-surface-2",
  success: "bg-success text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface p-5", className)}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "primary" | "success" | "accent" | "secondary";
}) {
  const bar: Record<string, string> = {
    primary: "from-primary to-primary-2",
    success: "from-success to-secondary",
    accent: "from-accent to-danger",
    secondary: "from-secondary to-primary",
  };
  return (
    <div className="card-hover relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-l", bar[tone])} />
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "primary",
  className,
}: {
  children: React.ReactNode;
  tone?: "primary" | "success" | "accent" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    muted: "bg-surface-2 text-muted",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export const fieldCls =
  "rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--ring)]";
