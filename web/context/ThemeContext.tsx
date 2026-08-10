"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("app:theme") as ColorScheme | null;
    const initial: ColorScheme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setColorScheme(initial);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", colorScheme === "dark");
    localStorage.setItem("app:theme", colorScheme);
  }, [colorScheme]);

  const toggle = () =>
    setColorScheme((s) => (s === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ colorScheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
