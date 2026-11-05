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

import { compareTeams, getTeams } from "../api/football";
import type { Team, TeamWithStats } from "../types/football";

type Comparison = [TeamWithStats, TeamWithStats];

interface ChartRow {
  metric: string;
  first: number;
  second: number;
}

interface TableRow {
  label: string;
  first: number;
  second: number;
}

export default function ComparePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [firstTeamId, setFirstTeamId] = useState("");
  const [secondTeamId, setSecondTeamId] = useState("");

  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTeams() {
      try {
        const data = await getTeams();

        if (!ignore) {
          setTeams(data);
          setFirstTeamId(data[0]?.team_id ?? "");
          setSecondTeamId(data[1]?.team_id ?? "");
        }
      } catch {
        if (!ignore) {
          setTeamsError("Unable to load teams. Check that the API is running.");
        }
      } finally {
        if (!ignore) {
          setTeamsLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      ignore = true;
    };
  }, []);

  function changeFirstTeam(teamId: string) {
    setFirstTeamId(teamId);
    setComparison(null);
    setComparisonError(null);
  }

  function changeSecondTeam(teamId: string) {
    setSecondTeamId(teamId);
    setComparison(null);
    setComparisonError(null);
  }

  async function handleCompare() {
    if (!firstTeamId || !secondTeamId) {
      setComparisonError("Select two teams.");
      return;
    }

    if (firstTeamId === secondTeamId) {
      setComparisonError("Select two different teams.");
      return;
    }

    setComparing(true);
    setComparisonError(null);
    setComparison(null);

    try {
      const data = await compareTeams(firstTeamId, secondTeamId);
      setComparison(data);
    } catch {
      setComparisonError(
        "Unable to compare these teams. Check that the API is running.",
      );
    } finally {
      setComparing(false);
    }
  }

  const first = comparison?.[0];
  const second = comparison?.[1];

  const goalData: ChartRow[] =
    first && second
      ? [
          {
            metric: "Goals scored",
            first: first.stats.goals_for,
            second: second.stats.goals_for,
          },
          {
            metric: "Goals conceded",
            first: first.stats.goals_against,
            second: second.stats.goals_against,
          },
          {
            metric: "Clean sheets",
            first: first.stats.clean_sheets,
            second: second.stats.clean_sheets,
          },
        ]
      : [];

  const resultData: ChartRow[] =
    first && second
      ? [
          {
            metric: "Wins",
            first: first.stats.wins,
            second: second.stats.wins,
          },
          {
            metric: "Draws",
            first: first.stats.draws,
            second: second.stats.draws,
          },
          {
            metric: "Losses",
            first: first.stats.losses,
            second: second.stats.losses,
          },
        ]
      : [];

  const tableRows: TableRow[] =
    first && second
      ? [
          {
            label: "League position",
            first: first.stats.rank,
            second: second.stats.rank,
          },
          {
            label: "Points",
            first: first.stats.points,
            second: second.stats.points,
          },
          {
            label: "Matches played",
            first: first.stats.matches_played,
            second: second.stats.matches_played,
          },
          {
            label: "Wins",
            first: first.stats.wins,
            second: second.stats.wins,
          },
          {
            label: "Draws",
            first: first.stats.draws,
            second: second.stats.draws,
          },
          {
            label: "Losses",
            first: first.stats.losses,
            second: second.stats.losses,
          },
          {
            label: "Goals scored",
            first: first.stats.goals_for,
            second: second.stats.goals_for,
          },
          {
            label: "Goals conceded",
            first: first.stats.goals_against,
            second: second.stats.goals_against,
          },
          {
            label: "Goal difference",
            first: first.stats.goal_difference,
            second: second.stats.goal_difference,
          },
          {
            label: "Clean sheets",
            first: first.stats.clean_sheets,
            second: second.stats.clean_sheets,
          },
          {
            label: "Shots",
            first: first.stats.shots,
            second: second.stats.shots,
          },
          {
            label: "Shots on target",
            first: first.stats.shots_on_target,
            second: second.stats.shots_on_target,
          },
          {
            label: "Corners",
            first: first.stats.corners,
            second: second.stats.corners,
          },
          {
            label: "Fouls",
            first: first.stats.fouls,
            second: second.stats.fouls,
          },
          {
            label: "Yellow cards",
            first: first.stats.yellow_cards,
            second: second.stats.yellow_cards,
          },
          {
            label: "Red cards",
            first: first.stats.red_cards,
            second: second.stats.red_cards,
          },
        ]
      : [];

  const invalidSelection =
    !firstTeamId || !secondTeamId || firstTeamId === secondTeamId;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-content">Compare Teams</h1>

        <p className="mt-2 text-muted">
          Compare Premier League performance for the 2025/26 season.
        </p>
      </header>

      {teamsLoading && (
        <p role="status" className="text-muted">
          Loading teams…
        </p>
      )}

      {teamsError && (
        <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-200">
          {teamsError}
        </p>
      )}

      {!teamsLoading && !teamsError && (
        <section
          aria-label="Select teams to compare"
          className="mb-6 rounded-xl border border-outline bg-surface p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TeamSelector
              id="compare-first-team"
              label="Team A"
              value={firstTeamId}
              teams={teams}
              disabled={comparing}
              onChange={changeFirstTeam}
            />

            <TeamSelector
              id="compare-second-team"
              label="Team B"
              value={secondTeamId}
              teams={teams}
              disabled={comparing}
              onChange={changeSecondTeam}
            />
          </div>

          {firstTeamId === secondTeamId && firstTeamId && (
            <p className="mt-3 text-sm text-amber-300">
              Choose two different teams.
            </p>
          )}

          <button
            type="button"
            disabled={invalidSelection || comparing}
            onClick={() => void handleCompare()}
            className="mt-4 min-h-11 rounded-lg bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {comparing ? "Comparing…" : "Compare teams"}
          </button>
        </section>
      )}

      {comparisonError && (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-red-950 p-4 text-red-200"
        >
          {comparisonError}
        </p>
      )}

      {comparing && (
        <p role="status" className="text-muted">
          Loading comparison…
        </p>
      )}

      {first && second && (
        <>
          <header className="mb-6">
            <h2 className="text-2xl font-semibold text-content">
              {first.team.name} vs {second.team.name}
            </h2>

            <p className="mt-2 text-sm text-muted">
              Season {first.stats.season}. Compare each metric between teams;
              lower goals conceded and fewer losses indicate better results for
              those metrics.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ComparisonChart
              title="Goals and defending"
              data={goalData}
              firstName={first.team.name}
              secondName={second.team.name}
            />

            <ComparisonChart
              title="Match results"
              data={resultData}
              firstName={first.team.name}
              secondName={second.team.name}
            />
          </div>

          <section className="rounded-xl border border-outline bg-surface p-4">
            <h3 className="mb-4 text-lg font-semibold text-content">
              Side-by-side statistics
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Season statistics for {first.team.name} and{" "}
                  {second.team.name}
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
                      {first.team.name}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3"
                      style={{ color: "var(--chart-series-b)" }}
                    >
                      {second.team.name}
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
                        {row.first.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-content">
                        {row.second.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

interface TeamSelectorProps {
  id: string;
  label: string;
  value: string;
  teams: Team[];
  disabled: boolean;
  onChange: (teamId: string) => void;
}

function TeamSelector({
  id,
  label,
  value,
  teams,
  disabled,
  onChange,
}: TeamSelectorProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-content"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-outline bg-surface-raised px-3 py-2 text-content disabled:opacity-50"
      >
        <option value="" disabled>
          Select a team
        </option>

        {teams.map((team) => (
          <option key={team.team_id} value={team.team_id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ComparisonChartProps {
  title: string;
  data: ChartRow[];
  firstName: string;
  secondName: string;
}

function ComparisonChart({
  title,
  data,
  firstName,
  secondName,
}: ComparisonChartProps) {
  const height = Math.max(300, data.length * 85 + 60);

  return (
    <section className="min-w-0 rounded-2xl border border-outline bg-surface p-4 shadow-sm sm:p-6">
      <header className="mb-5">
        <h3 className="text-lg font-semibold tracking-tight text-content">
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--chart-series-a)" }}
            />
            {firstName}
          </span>

          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--chart-series-b)" }}
            />
            {secondName}
          </span>
        </div>
      </header>

      <div
        style={{
          width: "100%",
          height,
          minWidth: 0,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 4,
              right: 12,
              bottom: 4,
              left: 0,
            }}
            barGap={4}
            barCategoryGap="25%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
            />

            <XAxis
              type="number"
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--text-secondary)",
                fontSize: 12,
              }}
              minTickGap={25}
            />

            <YAxis
              type="category"
              dataKey="metric"
              width={105}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--text-primary)",
                fontSize: 12,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: 12,
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
              dataKey="first"
              name={firstName}
              fill="var(--chart-series-a)"
              maxBarSize={22}
              radius={[0, 4, 4, 0]}
            />

            <Bar
              dataKey="second"
              name={secondName}
              fill="var(--chart-series-b)"
              maxBarSize={22}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}