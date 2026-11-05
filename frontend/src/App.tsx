import { useState } from "react";

import ComparisonPage from "./pages/ComparisonPage";
import PlayersPage from "./pages/PlayersPage";
import TeamsPage from "./pages/TeamsPage";
import ThemeToggle from "./components/ThemeToggle";

type Page = "teams" | "players" | "compare";

const MENU_ITEMS: { page: Page; label: string }[] = [
  { page: "teams", label: "Teams" },
  { page: "players", label: "Players" },
  { page: "compare", label: "Compare" },
];

export default function App() {
  const [page, setPage] = useState<Page>("teams");

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="sticky top-0 z-30 border-b border-outline bg-surface"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex gap-1 sm:gap-2">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.page}
                type="button"
                aria-pressed={page === item.page}
                onClick={() => setPage(item.page)}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-medium sm:px-4 ${
                  page === item.page
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-hover hover:text-content"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <ThemeToggle />
        </div>
      </nav>

      {page === "teams" && <TeamsPage />}
      {page === "players" && <PlayersPage />}
      {page === "compare" && <ComparisonPage />}
    </>
  );
}