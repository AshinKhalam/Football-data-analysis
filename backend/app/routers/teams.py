from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Team, TeamSeasonStat
from app.schemas import (
    TeamResponse,
    TeamSeasonStatResponse,
    TeamWithStatsResponse,
)


router = APIRouter(prefix="/api/teams", tags=["Teams"])

@router.get("/season", response_model=list[TeamWithStatsResponse])
def get_league_table(
    season: str = Query(default="2025/26"),
    db: Session = Depends(get_db),
) -> list[TeamWithStatsResponse]:
    statement = (
        select(Team, TeamSeasonStat)
        .join(
            TeamSeasonStat,
            TeamSeasonStat.team_id == Team.team_id,
        )
        .where(TeamSeasonStat.season == season)
        .order_by(TeamSeasonStat.rank)
    )

    rows = db.execute(statement).all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No team statistics found for season '{season}'.",
        )

    return [
        TeamWithStatsResponse(
            team=TeamResponse.model_validate(team),
            stats=TeamSeasonStatResponse.model_validate(stat),
        )
        for team, stat in rows
    ]

@router.get("", response_model=list[TeamResponse])
def get_teams(
    db: Session = Depends(get_db),
) -> list[Team]:
    statement = select(Team).order_by(Team.name)
    teams = db.scalars(statement).all()

    return list(teams)


@router.get("/{team_id}/stats", response_model=TeamWithStatsResponse)
def get_team_stats(
    team_id: str,
    season: str = Query(default="2025/26"),
    db: Session = Depends(get_db),
) -> TeamWithStatsResponse:
    statement = (
        select(Team, TeamSeasonStat)
        .join(
            TeamSeasonStat,
            TeamSeasonStat.team_id == Team.team_id,
        )
        .where(Team.team_id == team_id)
        .where(TeamSeasonStat.season == season)
    )

    row = db.execute(statement).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Team '{team_id}' not found for season '{season}'.",
        )

    team, stat = row

    return TeamWithStatsResponse(
        team=TeamResponse.model_validate(team),
        stats=TeamSeasonStatResponse.model_validate(stat),
    )