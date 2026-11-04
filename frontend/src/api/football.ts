import { api } from "./client";
import type { Player, PlayerWithStats, Team, TeamWithStats } from "../types/football";

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

interface PlayerFilters {
  search?: string;
  teamId?: string;
  season?: string;
  limit?: number;
  offset?: number;
}

export async function getPlayers(
  filters: PlayerFilters = {},
  signal?: AbortSignal,
): Promise<Player[]> {
  const response = await api.get<Player[]>("/api/players", {
    params: {
      search: filters.search || undefined,
      team_id: filters.teamId || undefined,
      season: filters.season ?? "2025/26",
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
    },
    signal,
  });

  return response.data;
}

export async function getPlayerStats(
  playerId: string,
  season: string = "2025/26",
  signal?: AbortSignal,
): Promise<PlayerWithStats> {
  const response = await api.get<PlayerWithStats>(
    `/api/players/${encodeURIComponent(playerId)}/stats`,
    {
      params: { season },
      signal,
    },
  );

  return response.data;
}

export async function compareTeams(
  firstTeamId: string,
  secondTeamId: string,
  season: string = "2025/26",
): Promise<[TeamWithStats, TeamWithStats]> {
  return Promise.all([
    getTeamStats(firstTeamId, season),
    getTeamStats(secondTeamId, season),
  ]);
}

export async function comparePlayers(
  firstPlayerId: string,
  secondPlayerId: string,
  season: string = "2025/26",
): Promise<[PlayerWithStats, PlayerWithStats]> {
  return Promise.all([
    getPlayerStats(firstPlayerId, season),
    getPlayerStats(secondPlayerId, season),
  ]);
}