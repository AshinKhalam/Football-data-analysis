import { useEffect, useState } from "react";

import { getLeagueTable } from "../api/football";
import type { TeamWithStats } from "../types/football";

interface LeagueTableProps {
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
}

export default function LeagueTable({
  selectedTeamId,
  onSelectTeam,
}: LeagueTableProps) {
  const [rows, setRows] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTable() {
      try {
        const data = await getLeagueTable();

        if (!ignore) {
          setRows(data);
        }
      } catch {
        if (!ignore) {
          setError("Unable to load the league table.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadTable();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading league table…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-950 p-4 text-red-200">
        {error}
      </p>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-gray-700 bg-gray-900 p-4">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Premier League table — 2025/26
      </h2>

      <p className="mb-4 text-sm text-gray-400">
        Select a team name to view its statistics below.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Premier League standings for the 2025/26 season
          </caption>

          <thead className="border-b border-gray-700 text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-3">Pos</th>
              <th scope="col" className="px-3 py-3">Team</th>
              <th scope="col" className="px-3 py-3">P</th>
              <th scope="col" className="px-3 py-3">W</th>
              <th scope="col" className="px-3 py-3">D</th>
              <th scope="col" className="px-3 py-3">L</th>
              <th scope="col" className="px-3 py-3">GF</th>
              <th scope="col" className="px-3 py-3">GA</th>
              <th scope="col" className="px-3 py-3">GD</th>
              <th scope="col" className="px-3 py-3">Pts</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(({ team, stats }) => {
              const selected = team.team_id === selectedTeamId;

              return (
                <tr
                  key={team.team_id}
                  className={
                    selected
                      ? "border-b border-gray-800 bg-blue-950"
                      : "border-b border-gray-800 hover:bg-gray-800"
                  }
                >
                  <td className="px-3 py-3">{stats.rank}</td>

                  <th scope="row" className="px-3 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => onSelectTeam(team.team_id)}
                      aria-pressed={selected}
                      className="text-left text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                      {team.name}
                    </button>
                  </th>

                  <td className="px-3 py-3">{stats.matches_played}</td>
                  <td className="px-3 py-3">{stats.wins}</td>
                  <td className="px-3 py-3">{stats.draws}</td>
                  <td className="px-3 py-3">{stats.losses}</td>
                  <td className="px-3 py-3">{stats.goals_for}</td>
                  <td className="px-3 py-3">{stats.goals_against}</td>
                  <td className="px-3 py-3">
                    {stats.goal_difference > 0 ? "+" : ""}
                    {stats.goal_difference}
                  </td>
                  <td className="px-3 py-3 font-bold text-white">
                    {stats.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}