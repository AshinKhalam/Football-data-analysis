from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    team_id: str
    name: str


class TeamSeasonStatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    team_id: str
    season: str
    rank: int
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    points_per_match: Decimal
    goals_per_match: Decimal
    goals_conceded_per_match: Decimal
    clean_sheets: int
    shots: int
    shots_on_target: int
    fouls: int
    corners: int
    yellow_cards: int
    red_cards: int
    average_attendance: int
    top_scorer_source_text: str | None
    goalkeeper_source_text: str | None
    notes: str | None


class TeamWithStatsResponse(BaseModel):
    team: TeamResponse
    stats: TeamSeasonStatResponse


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    match_id: str
    season: str
    match_date: date
    kickoff_local_time: str
    home_team_id: str
    away_team_id: str
    home_goals: int
    away_goals: int
    result: str