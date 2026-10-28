from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    team_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    season_stats: Mapped[list["TeamSeasonStat"]] = relationship(
        back_populates="team"
    )

    player_stats: Mapped[list["PlayerSeasonStat"]] = relationship(
        back_populates="team"
    )

    home_matches: Mapped[list["Match"]] = relationship(
        back_populates="home_team",
        foreign_keys="Match.home_team_id",
    )

    away_matches: Mapped[list["Match"]] = relationship(
        back_populates="away_team",
        foreign_keys="Match.away_team_id",
    )


class Player(Base):
    __tablename__ = "players"

    player_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    nation_code: Mapped[str] = mapped_column(String(3), nullable=False)
    birth_year: Mapped[int] = mapped_column(Integer, nullable=False)

    season_stats: Mapped[list["PlayerSeasonStat"]] = relationship(
        back_populates="player"
    )


class TeamSeasonStat(Base):
    __tablename__ = "team_season_stats"

    team_id: Mapped[str] = mapped_column(
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        primary_key=True,
    )

    season: Mapped[str] = mapped_column(String(10), primary_key=True)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    matches_played: Mapped[int] = mapped_column(Integer, nullable=False)
    wins: Mapped[int] = mapped_column(Integer, nullable=False)
    draws: Mapped[int] = mapped_column(Integer, nullable=False)
    losses: Mapped[int] = mapped_column(Integer, nullable=False)
    goals_for: Mapped[int] = mapped_column(Integer, nullable=False)
    goals_against: Mapped[int] = mapped_column(Integer, nullable=False)
    goal_difference: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    points_adjustment: Mapped[int] = mapped_column(Integer, nullable=False)
    points_per_match: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False
    )

    goals_per_match: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False
    )

    goals_conceded_per_match: Mapped[Decimal] = mapped_column(
        Numeric(6, 3), nullable=False
    )

    clean_sheets: Mapped[int] = mapped_column(Integer, nullable=False)
    shots: Mapped[int] = mapped_column(Integer, nullable=False)
    shots_on_target: Mapped[int] = mapped_column(Integer, nullable=False)
    fouls: Mapped[int] = mapped_column(Integer, nullable=False)
    corners: Mapped[int] = mapped_column(Integer, nullable=False)
    yellow_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    red_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    average_attendance: Mapped[int] = mapped_column(Integer, nullable=False)
    top_scorer_source_text: Mapped[str | None] = mapped_column(
        String(300), nullable=True
    )

    goalkeeper_source_text: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )

    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    team: Mapped[Team] = relationship(back_populates="season_stats")

    __table_args__ = (
        CheckConstraint("matches_played >= 0", name="ck_team_mp_nonnegative"),
        CheckConstraint("wins >= 0", name="ck_team_wins_nonnegative"),
        CheckConstraint("draws >= 0", name="ck_team_draws_nonnegative"),
        CheckConstraint("losses >= 0", name="ck_team_losses_nonnegative"),
        CheckConstraint("goals_for >= 0", name="ck_team_gf_nonnegative"),
        CheckConstraint("goals_against >= 0", name="ck_team_ga_nonnegative"),
        CheckConstraint("points >= 0", name="ck_team_points_nonnegative"),
    )


class PlayerSeasonStat(Base):
    __tablename__ = "player_season_stats"

    player_id: Mapped[str] = mapped_column(
        ForeignKey("players.player_id", ondelete="CASCADE"),
        primary_key=True,
    )

    team_id: Mapped[str] = mapped_column(
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        primary_key=True,
    )

    season: Mapped[str] = mapped_column(String(10), primary_key=True)
    position: Mapped[str] = mapped_column(String(4), nullable=False)
    primary_position: Mapped[str] = mapped_column(String(2), nullable=False)
    secondary_position: Mapped[str | None] = mapped_column(
        String(2), nullable=True
    )

    age_at_season_start: Mapped[int] = mapped_column(Integer, nullable=False)
    appearances: Mapped[int] = mapped_column(Integer, nullable=False)
    starts: Mapped[int] = mapped_column(Integer, nullable=False)
    minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    goals: Mapped[int] = mapped_column(Integer, nullable=False)
    assists: Mapped[int] = mapped_column(Integer, nullable=False)
    goal_contributions: Mapped[int] = mapped_column(Integer, nullable=False)
    non_penalty_goals: Mapped[int] = mapped_column(Integer, nullable=False)
    non_penalty_goal_contributions: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    penalties_scored: Mapped[int] = mapped_column(Integer, nullable=False)
    penalties_attempted: Mapped[int] = mapped_column(Integer, nullable=False)
    yellow_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    red_cards: Mapped[int] = mapped_column(Integer, nullable=False)

    goals_per_90: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 6), nullable=True
    )

    assists_per_90: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 6), nullable=True
    )

    goal_contributions_per_90: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 6), nullable=True
    )

    non_penalty_goals_per_90: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 6), nullable=True
    )

    non_penalty_goal_contributions_per_90: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 6), nullable=True
    )

    player: Mapped[Player] = relationship(back_populates="season_stats")
    team: Mapped[Team] = relationship(back_populates="player_stats")

    __table_args__ = (
        CheckConstraint("starts <= appearances", name="ck_player_starts"),
        CheckConstraint("minutes >= 0", name="ck_player_minutes_nonnegative"),
        CheckConstraint("goals >= 0", name="ck_player_goals_nonnegative"),
        CheckConstraint("assists >= 0", name="ck_player_assists_nonnegative"),
        CheckConstraint(
            "penalties_scored <= penalties_attempted",
            name="ck_player_penalties",
        ),
    )


class Match(Base):
    __tablename__ = "matches"

    match_id: Mapped[str] = mapped_column(String(200), primary_key=True)
    season: Mapped[str] = mapped_column(String(10), nullable=False)
    division: Mapped[str] = mapped_column(String(10), nullable=False)
    match_date: Mapped[date] = mapped_column(Date, nullable=False)
    kickoff_local_time: Mapped[str] = mapped_column(String(5), nullable=False)
    home_team_id: Mapped[str] = mapped_column(
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        nullable=False,
    )

    away_team_id: Mapped[str] = mapped_column(
        ForeignKey("teams.team_id", ondelete="CASCADE"),
        nullable=False,
    )

    home_goals: Mapped[int] = mapped_column(Integer, nullable=False)
    away_goals: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[str] = mapped_column(String(1), nullable=False)
    home_half_time_goals: Mapped[int] = mapped_column(Integer, nullable=False)
    away_half_time_goals: Mapped[int] = mapped_column(Integer, nullable=False)
    half_time_result: Mapped[str] = mapped_column(String(1), nullable=False)
    referee: Mapped[str | None] = mapped_column(String(200), nullable=True)
    home_shots: Mapped[int] = mapped_column(Integer, nullable=False)
    away_shots: Mapped[int] = mapped_column(Integer, nullable=False)
    home_shots_on_target: Mapped[int] = mapped_column(Integer, nullable=False)
    away_shots_on_target: Mapped[int] = mapped_column(Integer, nullable=False)
    home_fouls: Mapped[int] = mapped_column(Integer, nullable=False)
    away_fouls: Mapped[int] = mapped_column(Integer, nullable=False)
    home_corners: Mapped[int] = mapped_column(Integer, nullable=False)
    away_corners: Mapped[int] = mapped_column(Integer, nullable=False)
    home_yellow_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    away_yellow_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    home_red_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    away_red_cards: Mapped[int] = mapped_column(Integer, nullable=False)

    home_team: Mapped[Team] = relationship(
        back_populates="home_matches",
        foreign_keys=[home_team_id],
    )

    away_team: Mapped[Team] = relationship(
        back_populates="away_matches",
        foreign_keys=[away_team_id],
    )

    __table_args__ = (
        CheckConstraint(
            "home_team_id <> away_team_id",
            name="ck_match_distinct_teams",
        ),
        CheckConstraint("home_goals >= 0", name="ck_match_home_goals"),
        CheckConstraint("away_goals >= 0", name="ck_match_away_goals"),
        CheckConstraint(
            "result IN ('H', 'D', 'A')",
            name="ck_match_result",
        ),
        CheckConstraint(
            "half_time_result IN ('H', 'D', 'A')",
            name="ck_match_half_time_result",
        ),
        UniqueConstraint(
            "season",
            "home_team_id",
            "away_team_id",
            name="uq_match_fixture",
        ),
    )