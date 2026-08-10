"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { colorScheme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
