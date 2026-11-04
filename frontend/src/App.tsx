import { useState } from "react";

import ComparisonPage from "./pages/ComparisonPage";
import PlayersPage from "./pages/PlayersPage";
import TeamsPage from "./pages/TeamsPage";

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
        className="border-b border-gray-700 bg-gray-900"
      >
        <div className="mx-auto flex max-w-6xl gap-3 px-4 py-4">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.page}
              type="button"
              aria-pressed={page === item.page}
              onClick={() => setPage(item.page)}
              className={`rounded-lg px-4 py-2 font-medium ${
                page === item.page
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {page === "teams" && <TeamsPage />}
      {page === "players" && <PlayersPage />}
      {page === "compare" && <ComparisonPage />}
    </>
  );
}