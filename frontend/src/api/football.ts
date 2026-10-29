import { api } from "./client";
import type { Team, TeamWithStats } from "../types/football";

export async function getTeams(): Promise<Team[]> {
  const response = await api.get<Team[]>("/api/teams");
  return response.data;
}

export async function getTeamStats(
  teamId: string,
  season: string = "2025/26",
): Promise<TeamWithStats> {
  const response = await api.get<TeamWithStats>(
    `/api/teams/${teamId}/stats`,
    {
      params: { season },
    },
  );

  return response.data;
}

export async function getLeagueTable(
  season: string = "2025/26",
): Promise<TeamWithStats[]> {
  const response = await api.get<TeamWithStats[]>(
    "/api/teams/season",
    {
      params: { season },
    },
  );

  return response.data;
}