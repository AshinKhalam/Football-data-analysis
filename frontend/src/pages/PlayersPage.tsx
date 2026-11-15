import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getPlayerStats } from "../api/football";
import PlayerPicker from "../components/PlayerPicker";
import type { Player, PlayerWithStats } from "../types/football";

export default function PlayersPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerData, setPlayerData] = useState<PlayerWithStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const analysisRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!playerData || statsLoading) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    analysisRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [playerData, statsLoading]);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerData(null);
      setStatsError(null);
      setStatsLoading(false);
      return;
    }

    const currentPlayer = selectedPlayer;
    const controller = new AbortController();

    async function loadStats() {
      try {
        const data = await getPlayerStats(
          currentPlayer.player_id,
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

    setPlayerData(null);
    setStatsError(null);
    setStatsLoading(true);

    void loadStats();

    return () => {
      controller.abort();
    };
  }, [selectedPlayer]);

  const totals = playerData?.totals;

  const chartData = totals
    ? [
        { name: "Goals", value: totals.goals },
        { name: "Assists", value: totals.assists },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Premier League · 2025/26
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          Player Statistics
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Search for a player and view their season statistics. Use the team
          filter to narrow the search by club.
        </p>
      </header>

      <PlayerPicker
        id="selected-player"
        label="Select player"
        disabled={false}
        onSelect={setSelectedPlayer}
      />

      <section
        ref={analysisRef}
        aria-label="Selected player statistics"
        className="mt-6 min-w-0 scroll-mt-24"
      >
        {!selectedPlayer && (
          <div className="rounded-xl border border-dashed border-outline p-8 text-muted">
            Select a player to view their season statistics.
          </div>
        )}

        {statsLoading && (
          <p role="status" className="text-muted">
            Loading player statistics…
          </p>
        )}

        {statsError && (
          <p
            role="alert"
            className="rounded-lg bg-red-950 p-4 text-red-200"
          >
            {statsError}
          </p>
        )}

        {playerData && totals && !statsLoading && (
          <>
            <header className="mb-5">
              <h2 className="text-2xl font-bold text-content">
                {playerData.player.name}
              </h2>

              <p className="mt-1 text-muted">
                {playerData.player.nation_code} · Born{" "}
                {playerData.player.birth_year}
              </p>

              <p className="mt-2 text-sm text-muted">
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

            <section className="mb-6 rounded-xl border border-outline bg-surface p-4">
              <h3 className="mb-4 text-lg font-semibold text-content">
                Attacking output
              </h3>

              <div
                style={{
                  width: "100%",
                  height: 280,
                  minWidth: 0,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--chart-grid)"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="var(--text-secondary)"
                      tick={{
                        fill: "var(--text-secondary)",
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      stroke="var(--text-secondary)"
                      tick={{
                        fill: "var(--text-secondary)",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-strong)",
                        color: "var(--text-primary)",
                      }}
                      labelStyle={{
                        color: "var(--text-primary)",
                        marginBottom: 6,
                      }}
                      cursor={{
                        fill: "var(--surface-hover)",
                      }}
                    />

                    <Bar
                      dataKey="value"
                      name="Total"
                      fill="var(--chart-series-a)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-outline bg-surface p-4">
              <h3 className="mb-4 text-lg font-semibold text-content">
                Club breakdown
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Player statistics by club
                  </caption>

                  <thead className="border-b border-outline text-muted">
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
                        className="border-b border-outline"
                      >
                        <th
                          scope="row"
                          className="px-3 py-3 font-medium text-content"
                        >
                          {club.team_name}
                        </th>

                        <td className="px-3 py-3 text-content">
                          {club.position}
                        </td>

                        <td className="px-3 py-3 text-content">
                          {club.appearances}
                        </td>

                        <td className="px-3 py-3 text-content">
                          {club.minutes.toLocaleString()}
                        </td>

                        <td className="px-3 py-3 text-content">
                          {club.goals}
                        </td>

                        <td className="px-3 py-3 text-content">
                          {club.assists}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
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
    <div className="rounded-xl border border-outline bg-surface-raised p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-content">{value}</p>
    </div>
  );
}