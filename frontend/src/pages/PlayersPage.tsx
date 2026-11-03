import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getPlayers,
  getPlayerStats,
  getTeams,
} from "../api/football";

import type {
  Player,
  PlayerWithStats,
  Team,
} from "../types/football";

const PAGE_SIZE = 50;

export default function PlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("");
  const [offset, setOffset] = useState(0);

  const [players, setPlayers] = useState<Player[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerData, setPlayerData] = useState<PlayerWithStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getTeams()
      .then((data) => {
        if (!ignore) {
          setTeams(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTeamError("Unable to load the team filter.");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      async function loadPlayers() {
        try {
          const data = await getPlayers(
            {
              search: search.trim(),
              teamId,
              limit: PAGE_SIZE,
              offset,
            },
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setPlayers(data);
          }
        } catch {
          if (!controller.signal.aborted) {
            setListError("Unable to load players. Check that the API is running.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setListLoading(false);
          }
        }
      }

      void loadPlayers();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, teamId, offset]);

  useEffect(() => {
    if (!selectedPlayerId) {
      return;
    }

    const controller = new AbortController();

    async function loadStats() {
      try {
        const data = await getPlayerStats(
          selectedPlayerId,
          "2025/26",
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setPlayerData(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatsError("Unable to load this player's statistics.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      controller.abort();
    };
  }, [selectedPlayerId]);

  function resetResults() {
    setPlayers([]);
    setListLoading(true);
    setListError(null);
    setSelectedPlayerId("");
    setPlayerData(null);
    setStatsError(null);
    setStatsLoading(false);
  }

  function changeSearch(value: string) {
    resetResults();
    setOffset(0);
    setSearch(value);
  }

  function changeTeam(value: string) {
    resetResults();
    setOffset(0);
    setTeamId(value);
  }

  function changePage(nextOffset: number) {
    resetResults();
    setOffset(nextOffset);
  }

  function selectPlayer(playerId: string) {
    if (playerId === selectedPlayerId) {
      return;
    }

    setPlayerData(null);
    setStatsError(null);
    setStatsLoading(true);
    setSelectedPlayerId(playerId);
  }

  const totals = playerData?.totals;

  const chartData = totals
    ? [
        { name: "Goals", value: totals.goals },
        { name: "Assists", value: totals.assists },
      ]
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          Player Statistics
        </h1>
        <p className="mt-2 text-gray-400">
          Premier League · 2025/26
        </p>
      </header>

      <section
        aria-label="Player filters"
        className="mb-6 grid gap-4 rounded-xl border border-gray-700 bg-gray-900 p-4 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="player-search"
            className="mb-2 block text-sm text-gray-300"
          >
            Search by name
          </label>

          <input
            id="player-search"
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="For example, Haaland"
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label
            htmlFor="player-team"
            className="mb-2 block text-sm text-gray-300"
          >
            Filter by club
          </label>

          <select
            id="player-team"
            value={teamId}
            onChange={(event) => changeTeam(event.target.value)}
            className="w-full rounded-lg border border-gray-600 px-3 py-2"
          >
            <option value="">All clubs</option>

            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {teamError && (
          <p role="alert" className="text-sm text-red-300">
            {teamError}
          </p>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section
          aria-label="Player results"
          className="rounded-xl border border-gray-700 bg-gray-900 p-4"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">
            Players
          </h2>

          {listLoading && (
            <p role="status" className="text-gray-400">
              Loading players…
            </p>
          )}

          {listError && (
            <p role="alert" className="text-red-300">
              {listError}
            </p>
          )}

          {!listLoading && !listError && players.length === 0 && (
            <p className="text-gray-400">
              No players on this page. Adjust your filters or go back.
            </p>
          )}

          {!listLoading && !listError && (
            <ul className="max-h-[520px] space-y-2 overflow-y-auto">
              {players.map((player) => {
                const selected = player.player_id === selectedPlayerId;

                return (
                  <li key={player.player_id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectPlayer(player.player_id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-950"
                          : "border-gray-700 bg-gray-800 hover:border-gray-500"
                      }`}
                    >
                      <span className="block font-medium text-white">
                        {player.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {player.nation_code} · Born {player.birth_year}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={offset === 0 || listLoading}
              onClick={() => changePage(Math.max(0, offset - PAGE_SIZE))}
              className="rounded border border-gray-600 px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-400">
              Page {Math.floor(offset / PAGE_SIZE) + 1}
            </span>

            <button
              type="button"
              disabled={
                listLoading ||
                Boolean(listError) ||
                players.length < PAGE_SIZE
              }
              onClick={() => changePage(offset + PAGE_SIZE)}
              className="rounded border border-gray-600 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section aria-label="Selected player statistics" className="min-w-0">
          {!selectedPlayerId && (
            <div className="rounded-xl border border-dashed border-gray-600 p-8 text-gray-400">
              Select a player to view their season statistics.
            </div>
          )}

          {statsLoading && (
            <p role="status" className="text-gray-400">
              Loading player statistics…
            </p>
          )}

          {statsError && (
            <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-200">
              {statsError}
            </p>
          )}

          {playerData && totals && !statsLoading && (
            <>
              <header className="mb-5">
                <h2 className="text-2xl font-bold text-white">
                  {playerData.player.name}
                </h2>
                <p className="mt-1 text-gray-400">
                  {playerData.player.nation_code} · Born{" "}
                  {playerData.player.birth_year}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Totals cover all Premier League clubs represented in{" "}
                  {playerData.season}, regardless of the club filter.
                </p>
              </header>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Goals" value={totals.goals} />
                <StatCard label="Assists" value={totals.assists} />
                <StatCard
                  label="Goal contributions"
                  value={totals.goal_contributions}
                />
                <StatCard
                  label="Appearances"
                  value={totals.appearances}
                />
                <StatCard
                  label="Minutes"
                  value={totals.minutes.toLocaleString()}
                />
                <StatCard
                  label="Goals + assists / 90"
                  value={
                    totals.goal_contributions_per_90?.toFixed(2) ?? "—"
                  }
                />
              </div>

              <section className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-4">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Attacking output
                </h3>

                <div style={{ width: "100%", height: 280, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                      />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis allowDecimals={false} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          borderColor: "#4b5563",
                          color: "#ffffff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Total"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Club breakdown
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Player statistics by club
                    </caption>

                    <thead className="border-b border-gray-700 text-gray-400">
                      <tr>
                        {[
                          "Club",
                          "Position",
                          "Apps",
                          "Minutes",
                          "Goals",
                          "Assists",
                        ].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-3 py-3"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {playerData.clubs.map((club) => (
                        <tr
                          key={club.team_id}
                          className="border-b border-gray-800"
                        >
                          <th
                            scope="row"
                            className="px-3 py-3 font-medium text-white"
                          >
                            {club.team_name}
                          </th>
                          <td className="px-3 py-3">{club.position}</td>
                          <td className="px-3 py-3">{club.appearances}</td>
                          <td className="px-3 py-3">
                            {club.minutes.toLocaleString()}
                          </td>
                          <td className="px-3 py-3">{club.goals}</td>
                          <td className="px-3 py-3">{club.assists}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}