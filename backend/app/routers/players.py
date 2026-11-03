from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Player, PlayerSeasonStat, Team
from app.schemas import (
    PlayerClubStatsResponse,
    PlayerResponse,
    PlayerSeasonTotalsResponse,
    PlayerWithStatsResponse,
)


router = APIRouter(
    prefix="/api/players",
    tags=["Players"],
)


@router.get("", response_model=list[PlayerResponse])
def get_players(
    search: str | None = Query(default=None, max_length=100),
    team_id: str | None = Query(default=None),
    season: str = Query(default="2025/26"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = (
        select(Player)
        .join(
            PlayerSeasonStat,
            PlayerSeasonStat.player_id == Player.player_id,
        )
        .where(PlayerSeasonStat.season == season)
    )

    if search and search.strip():
        statement = statement.where(
            Player.name.icontains(
                search.strip(),
                autoescape=True,
            )
        )

    if team_id:
        statement = statement.where(
            PlayerSeasonStat.team_id == team_id
        )

    statement = (
        statement
        .distinct()
        .order_by(Player.name, Player.player_id)
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{player_id}/stats",
    response_model=PlayerWithStatsResponse,
)
def get_player_stats(
    player_id: str,
    season: str = Query(default="2025/26"),
    db: Session = Depends(get_db),
):
    player = db.get(Player, player_id)

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found.",
        )

    statement = (
        select(PlayerSeasonStat, Team.name)
        .join(
            Team,
            Team.team_id == PlayerSeasonStat.team_id,
        )
        .where(
            PlayerSeasonStat.player_id == player_id,
            PlayerSeasonStat.season == season,
        )
        .order_by(Team.name)
    )

    rows = db.execute(statement).all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No player statistics found for season '{season}'.",
        )

    total_fields = [
        "appearances",
        "starts",
        "minutes",
        "goals",
        "assists",
        "yellow_cards",
        "red_cards",
    ]

    totals = {
        field: sum(
            getattr(stat, field)
            for stat, _ in rows
        )
        for field in total_fields
    }

    totals["goal_contributions"] = (
        totals["goals"] + totals["assists"]
    )

    minutes = totals["minutes"]

    for field in [
        "goals",
        "assists",
        "goal_contributions",
    ]:
        totals[f"{field}_per_90"] = (
            round(totals[field] * 90 / minutes, 3)
            if minutes > 0
            else None
        )

    clubs = [
        PlayerClubStatsResponse(
            team_id=stat.team_id,
            team_name=team_name,
            position=stat.position,
            appearances=stat.appearances,
            starts=stat.starts,
            minutes=stat.minutes,
            goals=stat.goals,
            assists=stat.assists,
            yellow_cards=stat.yellow_cards,
            red_cards=stat.red_cards,
        )
        for stat, team_name in rows
    ]

    return PlayerWithStatsResponse(
        player=PlayerResponse.model_validate(player),
        season=season,
        totals=PlayerSeasonTotalsResponse(**totals),
        clubs=clubs,
    )