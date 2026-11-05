import { useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark",
  );

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      localStorage.setItem("football-theme", nextTheme);
    } catch {
      // The toggle still works if persistent storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="min-h-11 shrink-0 rounded-xl border border-outline bg-surface-raised px-3 py-2 text-sm font-medium text-content hover:bg-surface-hover"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}