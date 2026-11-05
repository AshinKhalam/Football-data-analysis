import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { comparePlayers } from "../api/football";
import PlayerPicker from "../components/PlayerPicker";
import type { Player, PlayerWithStats } from "../types/football";

type Comparison = [PlayerWithStats, PlayerWithStats];

interface ChartRow {
  metric: string;
  first: number | null;
  second: number | null;
}

export default function PlayerComparePage() {
  const [firstPlayer, setFirstPlayer] = useState<Player | null>(null);
  const [secondPlayer, setSecondPlayer] = useState<Player | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"totals" | "per90">("totals");

  function chooseFirst(player: Player) {
    setFirstPlayer(player);
    setComparison(null);
    setError(null);
  }

  function chooseSecond(player: Player) {
    setSecondPlayer(player);
    setComparison(null);
    setError(null);
  }

  async function handleCompare() {
    if (!firstPlayer || !secondPlayer) {
      return;
    }

    if (firstPlayer.player_id === secondPlayer.player_id) {
      setError("Choose two different players.");
      return;
    }

    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const data = await comparePlayers(
        firstPlayer.player_id,
        secondPlayer.player_id,
      );

      setComparison(data);
    } catch {
      setError("Unable to load the comparison. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }

  const first = comparison?.[0];
  const second = comparison?.[1];

  const samePlayer =
    firstPlayer !== null &&
    secondPlayer !== null &&
    firstPlayer.player_id === secondPlayer.player_id;

  const canCompare =
    firstPlayer !== null &&
    secondPlayer !== null &&
    !samePlayer &&
    !loading;

  const chartData: ChartRow[] =
    first && second
      ? [
          {
            metric: "Goals",
            first:
              mode === "totals"
                ? first.totals.goals
                : first.totals.goals_per_90,
            second:
              mode === "totals"
                ? second.totals.goals
                : second.totals.goals_per_90,
          },
          {
            metric: "Assists",
            first:
              mode === "totals"
                ? first.totals.assists
                : first.totals.assists_per_90,
            second:
              mode === "totals"
                ? second.totals.assists
                : second.totals.assists_per_90,
          },
        ]
      : [];

  const tableRows =
    first && second
      ? [
          {
            label: "Appearances",
            first: first.totals.appearances,
            second: second.totals.appearances,
          },
          {
            label: "Starts",
            first: first.totals.starts,
            second: second.totals.starts,
          },
          {
            label: "Minutes",
            first: first.totals.minutes,
            second: second.totals.minutes,
          },
          {
            label: "Goals",
            first: first.totals.goals,
            second: second.totals.goals,
          },
          {
            label: "Assists",
            first: first.totals.assists,
            second: second.totals.assists,
          },
          {
            label: "Goals + assists",
            first: first.totals.goal_contributions,
            second: second.totals.goal_contributions,
          },
          {
            label: "Goals / 90",
            first: formatRate(first.totals.goals_per_90),
            second: formatRate(second.totals.goals_per_90),
          },
          {
            label: "Assists / 90",
            first: formatRate(first.totals.assists_per_90),
            second: formatRate(second.totals.assists_per_90),
          },
          {
            label: "Goals + assists / 90",
            first: formatRate(first.totals.goal_contributions_per_90),
            second: formatRate(second.totals.goal_contributions_per_90),
          },
          {
            label: "Yellow cards",
            first: first.totals.yellow_cards,
            second: second.totals.yellow_cards,
          },
          {
            label: "Red cards",
            first: first.totals.red_cards,
            second: second.totals.red_cards,
          },
        ]
      : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-content">
          Compare Players
        </h1>
        <p className="mt-2 text-muted">
          Premier League · 2025/26 · All clubs combined
        </p>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <PlayerPicker
          id="first-player-search"
          label="Player A"
          selectedPlayer={firstPlayer}
          disabled={loading}
          onSelect={chooseFirst}
        />

        <PlayerPicker
          id="second-player-search"
          label="Player B"
          selectedPlayer={secondPlayer}
          disabled={loading}
          onSelect={chooseSecond}
        />
      </div>

      {samePlayer && (
        <p className="mt-3 text-sm text-amber-300">
          Choose two different players.
        </p>
      )}

      <button
        type="button"
        disabled={!canCompare}
        onClick={() => void handleCompare()}
        className="my-5 min-h-11 rounded-lg bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Comparing…" : "Compare players"}
      </button>

      {loading && (
        <p role="status" className="text-muted">
          Loading player statistics…
        </p>
      )}

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-red-950 p-4 text-red-200">
          {error}
        </p>
      )}

      {first && second && (
        <>
          <h2 className="mb-4 text-2xl font-semibold text-content">
            {first.player.name} vs {second.player.name}
          </h2>

          <p className="mb-5 rounded-lg border border-outline p-4 text-sm text-muted">
            Per-90 figures adjust for playing time, but can be misleading for
            players with very few minutes. Compare minutes and playing roles
            alongside these attacking statistics. These metrics are not an
            overall player rating.
          </p>

          <section className="mb-6 rounded-xl border border-outline bg-surface p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-content">
                Goals and assists
              </h3>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={mode === "totals"}
                  onClick={() => setMode("totals")}
                  className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "totals"
                      ? "bg-accent text-on-accent"
                      : "bg-surface-raised text-muted hover:bg-surface-hover hover:text-content"
                  }`}
                >
                  Season totals
                </button>

                <button
                  type="button"
                  aria-pressed={mode === "per90"}
                  onClick={() => setMode("per90")}
                  className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === "per90"
                      ? "bg-accent text-on-accent"
                      : "bg-surface-raised text-muted hover:bg-surface-hover hover:text-content"
                  }`}
                >
                  Per 90 minutes
                </button>
              </div>
            </div>

            <div style={{ width: "100%", height: 320, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--chart-grid)"
                  />

                  <XAxis
                    dataKey="metric"
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />

                  <YAxis
                    allowDecimals={mode === "per90"}
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
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

                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "var(--text-primary)" }}>
                        {value}
                      </span>
                    )}
                  />

                  <Bar
                    dataKey="first"
                    name={first.player.name}
                    fill="var(--chart-series-a)"
                    radius={[4, 4, 0, 0]}
                  />

                  <Bar
                    dataKey="second"
                    name={second.player.name}
                    fill="var(--chart-series-b)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-2 text-sm text-muted">
              {mode === "totals"
                ? "Total contributions across the season."
                : "Contributions per 90 minutes played. Missing rates are not treated as zero."}
            </p>
          </section>

          <section className="mb-6 rounded-xl border border-outline bg-surface p-4">
            <h3 className="mb-4 text-lg font-semibold text-content">
              Side-by-side statistics
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Season statistics for the selected players
                </caption>

                <thead className="border-b border-outline">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-muted">
                      Metric
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3"
                      style={{ color: "var(--chart-series-a)" }}
                    >
                      {first.player.name}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3"
                      style={{ color: "var(--chart-series-b)" }}
                    >
                      {second.player.name}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.label} className="border-b border-outline">
                      <th
                        scope="row"
                        className="px-3 py-3 font-medium text-content"
                      >
                        {row.label}
                      </th>
                      <td className="px-3 py-3 text-content">
                        {typeof row.first === "number"
                          ? row.first.toLocaleString()
                          : row.first}
                      </td>
                      <td className="px-3 py-3 text-content">
                        {typeof row.second === "number"
                          ? row.second.toLocaleString()
                          : row.second}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {[first, second].map((data) => (
              <section
                key={data.player.player_id}
                className="rounded-xl border border-outline bg-surface p-4"
              >
                <h3 className="mb-3 font-semibold text-content">
                  {data.player.name} — club breakdown
                </h3>

                <ul className="space-y-3">
                  {data.clubs.map((club) => (
                    <li
                      key={club.team_id}
                      className="rounded-lg bg-surface-raised p-3 text-sm text-muted"
                    >
                      <p className="font-medium text-content">
                        {club.team_name} · {club.position}
                      </p>
                      <p className="mt-1">
                        {club.minutes.toLocaleString()} minutes ·{" "}
                        {club.goals} goals · {club.assists} assists
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function formatRate(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}