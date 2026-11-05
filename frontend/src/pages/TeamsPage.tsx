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

import { getTeams, getTeamStats } from "../api/football";
import LeagueTable from "../components/LeagueTable";
import type { Team, TeamWithStats } from "../types/football";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamData, setTeamData] = useState<TeamWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyticsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTeams() {
      try {
        const data = await getTeams();

        if (!ignore) {
          setTeams(data);
          setSelectedTeamId(data[0]?.team_id ?? "");
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

  useEffect(() => {
    if (!selectedTeamId) {
      return;
    }

    let ignore = false;

    async function loadTeamStats() {
      setLoading(true);
      setError(null);
      setTeamData(null);

      try {
        const data = await getTeamStats(selectedTeamId);

        if (!ignore) {
          setTeamData(data);
        }
      } catch {
        if (!ignore) {
          setError(
            "Unable to load team statistics. Check that the API is running.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadTeamStats();

    return () => {
      ignore = true;
    };
  }, [selectedTeamId]);

  function selectTeamAndScroll(teamId: string) {
    setSelectedTeamId(teamId);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    analyticsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
  }

  const stats = teamData?.stats;

  const selectedTeamName = teams.find(
    (team) => team.team_id === selectedTeamId,
  )?.name;

  // Avoid displaying a previous team's data while selection changes.
  const showAnalytics =
    teamData !== null &&
    stats !== undefined &&
    teamData.team.team_id === selectedTeamId &&
    !loading;

  const goalsData = stats
    ? [
        { name: "Goals scored", value: stats.goals_for },
        { name: "Goals conceded", value: stats.goals_against },
        { name: "Clean sheets", value: stats.clean_sheets },
      ]
    : [];

  const resultsData = stats
    ? [
        { name: "Wins", value: stats.wins },
        { name: "Draws", value: stats.draws },
        { name: "Losses", value: stats.losses },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Premier League · 2025/26
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          Team Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Explore the league table and select a club to view its season
          statistics.
        </p>
      </header>

      <LeagueTable
        selectedTeamId={selectedTeamId}
        onSelectTeam={selectTeamAndScroll}
      />

      <section
        aria-label="Choose a team"
        className="mt-6 rounded-2xl border border-outline bg-surface p-4 sm:p-6"
      >
        <label
          htmlFor="team"
          className="mb-2 block text-sm font-medium text-content"
        >
          Select team
        </label>

        <select
          id="team"
          value={selectedTeamId}
          onChange={(event) => selectTeamAndScroll(event.target.value)}
          disabled={teamsLoading || teams.length === 0}
          className="w-full rounded-xl border border-outline bg-surface-raised px-3 py-2 text-content disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-sm"
        >
          {teamsLoading ? (
            <option value="">Loading teams…</option>
          ) : teams.length === 0 ? (
            <option value="">No teams available</option>
          ) : (
            teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))
          )}
        </select>

        <p className="mt-2 text-xs leading-5 text-muted">
          You can also click any team row in the table to jump to its analytics.
        </p>

        {teamsError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-outline bg-surface-raised p-3 text-sm text-content"
          >
            {teamsError}
          </p>
        )}
      </section>

      {/* Always mounted so row clicks have a reliable scroll target. */}
      <section
        ref={analyticsRef}
        aria-label="Selected team analytics"
        aria-busy={loading}
        className="analytics-section mt-8 min-h-[350px] scroll-mt-32"
      >
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-outline bg-surface p-4 sm:p-6"
          >
            <h2 className="font-semibold text-content">
              Statistics unavailable
            </h2>

            <p className="mt-2 text-sm text-muted">
              {error}
            </p>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="rounded-2xl border border-outline bg-surface p-6"
          >
            <p className="font-medium text-content">
              Loading {selectedTeamName ?? "team"} analytics…
            </p>

            <p className="mt-2 text-sm text-muted">
              Retrieving season statistics.
            </p>
          </div>
        )}

        {!selectedTeamId && !teamsLoading && !teamsError && (
          <p className="text-sm text-muted">
            Select a team to view its analytics.
          </p>
        )}

        {showAnalytics && teamData && stats && (
          <>
            <header className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                Season overview
              </p>

              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-content sm:text-3xl">
                {teamData.team.name}
              </h2>

              <p className="mt-2 text-sm text-muted">
                {stats.season} · {stats.matches_played} league matches
              </p>
            </header>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard label="League position" value={stats.rank} />
              <StatCard label="Points" value={stats.points} />
              <StatCard label="Goals scored" value={stats.goals_for} />
              <StatCard label="Goals conceded" value={stats.goals_against} />

              <StatCard
                label="Goal difference"
                value={
                  stats.goal_difference > 0
                    ? `+${stats.goal_difference}`
                    : stats.goal_difference
                }
              />

              <StatCard label="Clean sheets" value={stats.clean_sheets} />
              <StatCard label="Wins" value={stats.wins} />
              <StatCard label="Losses" value={stats.losses} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SeasonChart
                title="Goals and defending"
                description="Goals scored, goals conceded, and matches without conceding."
                data={goalsData}
              />

              <SeasonChart
                title="Match results"
                description={`${stats.wins} wins, ${stats.draws} draws, and ${stats.losses} losses.`}
                data={resultsData}
              />
            </div>
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
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-outline bg-surface p-4 sm:p-5">
      <p className="text-xs font-medium leading-5 text-muted sm:text-sm">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-content tabular-nums sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

interface SeasonChartProps {
  title: string;
  description: string;
  data: {
    name: string;
    value: number;
  }[];
}

function SeasonChart({
  title,
  description,
  data,
}: SeasonChartProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-outline bg-surface p-4 sm:p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-content">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-muted">
          {description}
        </p>
      </header>

      <div style={{ width: "100%", height: 280, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 8,
              right: 18,
              bottom: 4,
              left: 0,
            }}
            barCategoryGap="30%"
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
              tickMargin={8}
              minTickGap={24}
              tick={{
                fill: "var(--text-secondary)",
                fontSize: 12,
              }}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={105}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--text-secondary)",
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
              }}
              itemStyle={{
                color: "var(--text-primary)",
              }}
              cursor={{
                fill: "var(--surface-hover)",
              }}
            />

            <Bar
              dataKey="value"
              name="Total"
              fill="var(--accent)"
              maxBarSize={30}
              radius={[0, 5, 5, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}