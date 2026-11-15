import { useEffect, useRef, useState } from "react";

import { getPlayers, getTeams } from "../api/football";
import type { Player, Team } from "../types/football";

interface PlayerPickerProps {
  id: string;
  label: string;
  disabled: boolean;
  onSelect: (player: Player) => void;
}

export default function PlayerPicker({
  id,
  label,
  disabled,
  onSelect,
}: PlayerPickerProps) {
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Player[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const data = await getTeams();

        if (active) {
          setTeams(data);
        }
      } catch {
        if (active) {
          setError("Unable to load teams.");
        }
      }
    }

    void loadTeams();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmedSearch = search.trim();

    if (!teamId && trimmedSearch.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      async function loadPlayers() {
        try {
          const data = await getPlayers(
            {
              search: trimmedSearch || undefined,
              teamId: teamId || undefined,
              limit: 50,
            },
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setResults(data);
          }
        } catch {
          if (!controller.signal.aborted) {
            setError("Unable to load players.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      void loadPlayers();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, teamId]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results, isDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function changeSearch(value: string) {
    setSearch(value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);
    setError(null);
    setLoading(true);
  }

  function choosePlayer(player: Player) {
    onSelect(player);
    setSearch(player.name);
    setResults([]);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    setError(null);
    setLoading(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isDropdownOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setIsDropdownOpen(true);
      }

      return;
    }

    if (visibleResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex === visibleResults.length - 1
          ? 0
          : currentIndex + 1,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex <= 0
          ? visibleResults.length - 1
          : currentIndex - 1,
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const playerToSelect =
        highlightedIndex >= 0
          ? visibleResults[highlightedIndex]
          : visibleResults[0];

      if (playerToSelect) {
        choosePlayer(playerToSelect);
      }
    }
  }

  const visibleResults = results.filter((player) =>
    player.name
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="min-w-0 rounded-xl border border-outline bg-surface p-4">
      <label
        htmlFor={id}
        className="mb-2 block font-medium text-content"
      >
        {label}
      </label>

      <div
        ref={pickerRef}
        className="relative flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="search"
            value={search}
            disabled={disabled}
            maxLength={100}
            autoComplete="off"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-controls={`${id}-results`}
            aria-autocomplete="list"
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${id}-option-${highlightedIndex}`
                : undefined
            }
            onChange={(event) => changeSearch(event.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              teamId
                ? "Search players in selected team…"
                : "Type at least 2 characters to search all players"
            }
            className="w-full rounded-lg border border-outline bg-surface-raised px-3 py-2 text-content disabled:opacity-50"
          />

          {isDropdownOpen && (teamId || search.trim().length >= 2) && (
            <div
              id={`${id}-results`}
              role="listbox"
              className="absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-lg border border-outline bg-surface-raised shadow-lg"
            >
              {loading && (
                <p className="px-3 py-3 text-sm text-muted">
                  Loading players…
                </p>
              )}

              {!loading && error && (
                <p className="px-3 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {!loading &&
                !error &&
                visibleResults.length === 0 && (
                  <p className="px-3 py-3 text-sm text-muted">
                    No matching players.
                  </p>
                )}

              {!loading &&
                !error &&
                visibleResults.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto">
                    {visibleResults.map((player, index) => {
                      const isHighlighted =
                        index === highlightedIndex;

                      return (
                        <li
                          key={player.player_id}
                          id={`${id}-option-${index}`}
                          role="option"
                          aria-selected={isHighlighted}
                        >
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => choosePlayer(player)}
                            onMouseEnter={() =>
                              setHighlightedIndex(index)
                            }
                            className={`flex w-full items-center justify-between gap-3 border-b border-outline px-3 py-2 text-left last:border-b-0 ${
                              isHighlighted
                                ? "bg-surface-hover"
                                : "hover:bg-surface-hover"
                            } disabled:opacity-50`}
                          >
                            <span className="min-w-0 truncate text-content">
                              {player.name}
                            </span>

                            <span className="shrink-0 text-sm text-muted">
                              {player.nation_code}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>
          )}
        </div>

        <select
          value={teamId}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => {
            setTeamId(event.target.value);
            setSearch("");
            setResults([]);
            setError(null);
            setIsDropdownOpen(false);
            setHighlightedIndex(-1);
          }}
          className="w-full rounded-lg border border-outline bg-surface-raised px-3 py-2 text-content disabled:opacity-50 sm:w-56"
        >
          <option value="">All teams</option>

          {teams.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}