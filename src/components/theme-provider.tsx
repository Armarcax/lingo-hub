import { useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const KEY = "nur:theme";

/**
 * ThemeProvider — restores persisted theme on mount and toggles the `dark`
 * class on <html>. Safe under SSR: mutations happen only in useEffect.
 * Tailwind v4 dark variant is wired via `@custom-variant dark (&:is(.dark *))`
 * in src/styles.css.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as Theme | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme: Theme = stored ?? (prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch {
      // localStorage or matchMedia unavailable — leave default (light)
    }
  }, []);
  return <>{children}</>;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const setTheme = (t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem(KEY, t); } catch {}
    setThemeState(t);
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
