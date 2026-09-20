"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("khota-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const timer = setTimeout(() => {
      setIsDark(dark);
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("khota-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("khota-theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-border/60 bg-surface/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="تبديل المظهر"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface/70 text-foreground hover:bg-surface-raised active:scale-95 transition-all shadow-xs cursor-pointer"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
}
