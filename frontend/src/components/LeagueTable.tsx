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
    return <p className="text-muted">Loading league table…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-950 p-4 text-red-200">
        {error}
      </p>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-outline bg-surface p-3 sm:p-4">
      <h2 className="mb-3 text-lg font-semibold text-content sm:text-xl sm:mb-4">
        Premier League table — 2025/26
      </h2>

      <p className="mb-3 text-sm text-muted sm:mb-4">
        Select a team name to view its statistics below.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-left text-xs sm:text-sm">
          <caption className="sr-only">
            Premier League standings for the 2025/26 season
          </caption>

          <thead className="border-b border-outline text-muted">
            <tr>
              <th
                scope="col"
                className="px-2 py-2 text-right sm:px-3 sm:py-3"
              >
                Pos
              </th>

              <th
                scope="col"
                className="sticky left-0 z-10 bg-surface px-2 py-2 text-left sm:px-3 sm:py-3"
              >
                Team
              </th>

              {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-2 py-2 text-right sm:px-3 sm:py-3"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(({ team, stats }) => {
              const selected = team.team_id === selectedTeamId;

              return (
                <tr
                  key={team.team_id}
                  onClick={() => onSelectTeam(team.team_id)}
                  className={`group cursor-pointer transition-colors focus-within:bg-selection ${
                    selected ? "bg-selection" : "hover:bg-surface-hover"
                  }`}
                >
                  <td className="border-b border-outline px-2 py-2 text-right text-muted tabular-nums sm:px-3 sm:py-3">
                    {stats.rank}
                  </td>

                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-b border-outline px-2 py-2 text-left font-medium sm:px-3 sm:py-3 ${
                      selected
                        ? "bg-selection"
                        : "bg-surface group-hover:bg-surface-hover"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectTeam(team.team_id);
                      }}
                      aria-pressed={selected}
                      aria-label={`View ${team.name} analytics`}
                      className="min-h-9 text-left text-content underline-offset-4 hover:underline sm:min-h-11"
                    >
                      {teamDisplayName(team.name)}
                    </button>
                  </th>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.matches_played}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.wins}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.draws}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.losses}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.goals_for}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.goals_against}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right text-content tabular-nums sm:px-3 sm:py-3">
                    {stats.goal_difference > 0 ? "+" : ""}
                    {stats.goal_difference}
                  </td>

                  <td className="border-b border-outline px-2 py-2 text-right font-semibold text-content tabular-nums sm:px-3 sm:py-3">
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

function teamDisplayName(name: string): string {
  const shortNames: Record<string, string> = {
    "Manchester United": "Man United",
    "Manchester City": "Man City",
    "Brighton and Hove Albion": "Brighton",
    "Tottenham Hotspur": "Tottenham",
    "Wolverhampton Wanderers": "Wolves",
    "Newcastle United": "Newcastle",
    "West Ham United": "West Ham",
    "Nottingham Forest": "Nottm Forest",
    "AFC Bournemouth": "Bournemouth",
  };

  return shortNames[name] ?? name;
}