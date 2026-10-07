"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] text-xs h-8 w-[98px]" />
    );
  }

  return (
    <div
      role="group"
      aria-label="Selecionar tema"
      className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--ink)]"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Tema claro"
        aria-pressed={theme === "light"}
        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
          theme === "light"
            ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Tema escuro"
        aria-pressed={theme === "dark"}
        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
          theme === "dark"
            ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        aria-label="Tema do sistema"
        aria-pressed={theme === "system"}
        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
          theme === "system"
            ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
            : "text-[var(--muted)] hover:text-[var(--ink)]"
        }`}
      >
        <Laptop className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
