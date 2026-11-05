import { useEffect, useState } from "react";

import { getPlayers } from "../api/football";
import type { Player } from "../types/football";

interface PlayerPickerProps {
  id: string;
  label: string;
  selectedPlayer: Player | null;
  disabled: boolean;
  onSelect: (player: Player) => void;
}

export default function PlayerPicker({
  id,
  label,
  selectedPlayer,
  disabled,
  onSelect,
}: PlayerPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      async function searchPlayers() {
        try {
          const data = await getPlayers(
            {
              search: search.trim(),
              limit: 10,
            },
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setResults(data);
          }
        } catch {
          if (!controller.signal.aborted) {
            setError("Unable to search players.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      void searchPlayers();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  function changeSearch(value: string) {
    setSearch(value);
    setResults([]);
    setError(null);
    setLoading(value.trim().length >= 2);
  }

  function choosePlayer(player: Player) {
    onSelect(player);
    setSearch("");
    setResults([]);
    setError(null);
    setLoading(false);
  }

  return (
    <section className="min-w-0 rounded-xl border border-outline bg-surface p-4">
      <label
        htmlFor={id}
        className="mb-2 block font-medium text-content"
      >
        {label}
      </label>

      <input
        id={id}
        type="search"
        value={search}
        disabled={disabled}
        maxLength={100}
        onChange={(event) => changeSearch(event.target.value)}
        placeholder="Type at least 2 characters"
        className="w-full rounded-lg border border-outline bg-surface-raised px-3 py-2 text-content disabled:opacity-50"
      />

      <div className="mt-3 min-h-12">
        {selectedPlayer ? (
          <p className="text-sm text-content">
            Selected:{" "}
            <span className="font-semibold text-content">
              {selectedPlayer.name}
            </span>
            {" · "}
            {selectedPlayer.nation_code}
          </p>
        ) : (
          <p className="text-sm text-muted">
            No player selected.
          </p>
        )}
      </div>

      {loading && (
        <p role="status" className="mt-2 text-sm text-muted">
          Searching…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        search.trim().length >= 2 &&
        results.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            No matching players.
          </p>
        )}

      {!loading && results.length > 0 && (
        <>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {results.map((player) => (
              <li key={player.player_id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => choosePlayer(player)}
                  className="w-full rounded-lg border border-outline bg-surface-raised p-3 text-left hover:border-outline-strong disabled:opacity-50"
                >
                  <span className="block text-content">
                    {player.name}
                  </span>
                  <span className="text-sm text-muted">
                    {player.nation_code} · Born {player.birth_year}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-muted">
            Showing up to 10 matches. Refine your search if needed.
          </p>
        </>
      )}
    </section>
  );
}