import { useState } from "react";

import PlayersPage from "./pages/PlayersPage";
import TeamsPage from "./pages/TeamsPage";

export default function App() {
  const [page, setPage] = useState<"teams" | "players">("teams");

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="border-b border-gray-700 bg-gray-900"
      >
        <div className="mx-auto flex max-w-6xl gap-3 px-4 py-4">
          <button
            type="button"
            aria-pressed={page === "teams"}
            onClick={() => setPage("teams")}
            className={`rounded-lg px-4 py-2 font-medium ${
              page === "teams"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Teams
          </button>

          <button
            type="button"
            aria-pressed={page === "players"}
            onClick={() => setPage("players")}
            className={`rounded-lg px-4 py-2 font-medium ${
              page === "players"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Players
          </button>
        </div>
      </nav>

      {page === "teams" ? <TeamsPage /> : <PlayersPage />}
    </>
  );
}