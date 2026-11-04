import { useState } from "react";

import ComparePage from "./ComparePage";
import PlayerComparePage from "./PlayerComparePage";

export default function ComparisonPage() {
  const [mode, setMode] = useState<"teams" | "players">("teams");

  return (
    <>
      <div
        aria-label="Comparison type"
        className="mx-auto flex max-w-6xl gap-3 px-4 pt-6"
      >
        <button
          type="button"
          aria-pressed={mode === "teams"}
          onClick={() => setMode("teams")}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === "teams"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Compare teams
        </button>

        <button
          type="button"
          aria-pressed={mode === "players"}
          onClick={() => setMode("players")}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === "players"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          Compare players
        </button>
      </div>

      {mode === "teams" ? <ComparePage /> : <PlayerComparePage />}
    </>
  );
}