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