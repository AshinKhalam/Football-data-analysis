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
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "teams"
              ? "bg-accent text-on-accent"
              : "bg-surface-raised text-muted hover:bg-surface-hover hover:text-content"
          }`}
        >
          Compare teams
        </button>

        <button
          type="button"
          aria-pressed={mode === "players"}
          onClick={() => setMode("players")}
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "players"
              ? "bg-accent text-on-accent"
              : "bg-surface-raised text-muted hover:bg-surface-hover hover:text-content"
          }`}
        >
          Compare players
        </button>
      </div>

      {mode === "teams" ? <ComparePage /> : <PlayerComparePage />}
    </>
  );
}