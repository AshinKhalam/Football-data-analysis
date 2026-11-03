export interface Team {
  team_id: string;
  name: string;
}

export interface TeamSeasonStats {
  team_id: string;
  season: string;
  rank: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  points_per_match: number;
  goals_per_match: number;
  goals_conceded_per_match: number;
  clean_sheets: number;
  shots: number;
  shots_on_target: number;
  fouls: number;
  corners: number;
  yellow_cards: number;
  red_cards: number;
  average_attendance: number;
  top_scorer_source_text: string | null;
  goalkeeper_source_text: string | null;
  notes: string | null;
}

export interface TeamWithStats {
  team: Team;
  stats: TeamSeasonStats;
}

export interface Player {
  player_id: string;
  name: string;
  nation_code: string;
  birth_year: number;
}

export interface PlayerClubStats {
  team_id: string;
  team_name: string;
  position: string;
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export interface PlayerSeasonTotals {
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  goal_contributions: number;
  yellow_cards: number;
  red_cards: number;
  goals_per_90: number | null;
  assists_per_90: number | null;
  goal_contributions_per_90: number | null;
}

export interface PlayerWithStats {
  player: Player;
  season: string;
  totals: PlayerSeasonTotals;
  clubs: PlayerClubStats[];
}