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

import { getTeams, getTeamStats } from "./api/football";
import type { Team, TeamWithStats } from "./types/football";
import LeagueTable from "./components/LeagueTable";

export default function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teamData, setTeamData] = useState<TeamWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeams()
      .then((data) => {
        setTeams(data);

        if (data.length > 0) {
          setSelectedTeamId(data[0].team_id);
        }
      })
      .catch(() => setError("Unable to load teams."));
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
        setError("Unable to load team statistics.");
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

  const stats = teamData?.stats;

  const chartData = stats
    ? [
        { name: "Goals for", value: stats.goals_for },
        { name: "Goals against", value: stats.goals_against },
        { name: "Clean sheets", value: stats.clean_sheets },
        { name: "Wins", value: stats.wins },
        { name: "Draws", value: stats.draws },
        { name: "Losses", value: stats.losses },
      ]
    : [];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Premier League Analytics</h1>
        <p className="text-gray-400">
          Explore team performance for the 2025/26 season.
        </p>
      </header>

      <LeagueTable
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
      />

      <section className="mb-6">
        <label htmlFor="team" className="mb-2 block font-medium">
          Select team
        </label>

        <select
          id="team"
          value={selectedTeamId}
          onChange={(event) => setSelectedTeamId(event.target.value)}
          className="w-full rounded border border-gray-300 p-2"
        >
          {teams.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {team.name}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>
      )}

      {loading && <p>Loading team statistics…</p>}

      {teamData && stats && !loading && (
        <>
          <section className="mb-6 rounded-lg border p-4">
            <h2 className="mb-4 text-2xl font-semibold">
              {teamData.team.name}
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="League position" value={stats.rank} />
              <StatCard label="Points" value={stats.points} />
              <StatCard label="Goals for" value={stats.goals_for} />
              <StatCard label="Goals against" value={stats.goals_against} />
              <StatCard label="Goal difference" value={stats.goal_difference} />
              <StatCard label="Clean sheets" value={stats.clean_sheets} />
              <StatCard label="Wins" value={stats.wins} />
              <StatCard label="Losses" value={stats.losses} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-xl font-semibold">
              Season performance
            </h3>

            <div style={{ width: "100%", height: 320, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}