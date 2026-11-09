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
    return <p className="text-muted">Loading league table… The demo server may take about a minute to wake up after inactivity.</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-950 p-4 text-red-200">
        {error}
      </p>
    );
  }

  return (
    <section className="mb-8 min-w-0 rounded-xl border border-outline bg-surface p-2 sm:p-4">
      <h2 className="mb-3 text-lg font-semibold text-content sm:text-xl">
        Premier League table — 2025/26
      </h2>

      <p className="mb-3 text-xs text-muted sm:text-sm">
        Select a team name to view its statistics below.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 text-[10px] leading-tight text-content sm:text-sm">
          <caption className="sr-only">
            Premier League standings for the 2025/26 season.
            P: played; W: wins; D: draws; L: losses;
            GF–GA: goals for and against; GD: goal difference; Pts: points.
          </caption>

          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[30%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead className="text-muted">
            <tr>
              <th
                scope="col"
                className="border-b border-outline px-0.5 py-3 text-center sm:px-2"
              >
                #
              </th>

              <th
                scope="col"
                className="border-b border-outline px-1 py-3 text-left sm:px-2"
              >
                Team
              </th>

              {["P", "W", "D", "L", "GF–GA", "GD", "Pts"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap border-b border-outline px-0.5 py-3 text-center sm:px-2"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(({ team, stats }) => {
              const selected = team.team_id === selectedTeamId;

              const numberCell =
                "whitespace-nowrap border-b border-outline px-0.5 py-2 text-center tabular-nums sm:px-2 sm:py-3";

              return (
                <tr
                  key={team.team_id}
                  onClick={() => onSelectTeam(team.team_id)}
                  className={`cursor-pointer ${
                    selected
                      ? "bg-selection"
                      : "hover:bg-surface-hover focus-within:bg-selection"
                  }`}
                >
                  <td className={`${numberCell} text-muted`}>
                    {stats.rank}
                  </td>

                  <th
                    scope="row"
                    className="border-b border-outline px-1 py-2 text-left font-medium sm:px-2 sm:py-3"
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectTeam(team.team_id);
                      }}
                      aria-pressed={selected}
                      aria-label={`View ${team.name} analytics`}
                      title={team.name}
                      className="flex min-h-11 w-full items-center text-left text-content"
                    >
                      <span className="min-w-0 break-words">
                        {teamDisplayName(team.name)}
                      </span>
                    </button>
                  </th>

                  <td className={numberCell}>
                    {stats.matches_played}
                  </td>

                  <td className={numberCell}>
                    {stats.wins}
                  </td>

                  <td className={numberCell}>
                    {stats.draws}
                  </td>

                  <td className={numberCell}>
                    {stats.losses}
                  </td>

                  <td className={numberCell}>
                    {stats.goals_for}–{stats.goals_against}
                  </td>

                  <td className={numberCell}>
                    {stats.goal_difference > 0 ? "+" : ""}
                    {stats.goal_difference}
                  </td>

                  <td className={`${numberCell} font-semibold`}>
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