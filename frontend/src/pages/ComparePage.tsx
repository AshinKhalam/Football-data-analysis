import { useEffect, useState } from "react";
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
    !firstTeamId ||
    !secondTeamId ||
    firstTeamId === secondTeamId;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          Compare Teams
        </h1>

        <p className="mt-2 text-gray-400">
          Compare Premier League performance for the 2025/26 season.
        </p>
      </header>

      {teamsLoading && (
        <p role="status" className="text-gray-400">
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
          className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TeamSelector
              id="compare-first-team"
              label="Team A — blue"
              value={firstTeamId}
              teams={teams}
              disabled={comparing}
              onChange={changeFirstTeam}
            />

            <TeamSelector
              id="compare-second-team"
              label="Team B — orange"
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
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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
        <p role="status" className="text-gray-400">
          Loading comparison…
        </p>
      )}

      {first && second && (
        <>
          <header className="mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {first.team.name} vs {second.team.name}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Season {first.stats.season}. Compare each metric between
              teams; lower goals conceded and fewer losses indicate
              better results for those metrics.
            </p>
          </header>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
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

          <section className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Side-by-side statistics
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Season statistics for {first.team.name} and{" "}
                  {second.team.name}
                </caption>

                <thead className="border-b border-gray-700">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-gray-400">
                      Metric
                    </th>
                    <th scope="col" className="px-3 py-3 text-blue-400">
                      {first.team.name}
                    </th>
                    <th scope="col" className="px-3 py-3 text-orange-400">
                      {second.team.name}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-gray-800"
                    >
                      <th
                        scope="row"
                        className="px-3 py-3 font-medium text-gray-300"
                      >
                        {row.label}
                      </th>
                      <td className="px-3 py-3 text-white">
                        {row.first.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-white">
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
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-600 px-3 py-2 disabled:opacity-50"
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
  return (
    <section className="min-w-0 rounded-xl border border-gray-700 bg-gray-900 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">
        {title}
      </h3>

      <div style={{ width: "100%", height: 320, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            <XAxis
              dataKey="metric"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              interval={0}
            />

            <YAxis
              allowDecimals={false}
              stroke="#9ca3af"
              width={40}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#4b5563",
                color: "#ffffff",
              }}
              labelStyle={{ color: "#ffffff" }}
              cursor={{ fill: "#ffffff", fillOpacity: 0.05 }}
            />

            <Legend />

            <Bar
              dataKey="first"
              name={firstName}
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="second"
              name={secondName}
              fill="#f97316"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}