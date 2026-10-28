from pathlib import Path
import argparse
import sys

import pandas as pd
from sqlalchemy.dialects.postgresql import insert

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
DEFAULT_PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Match,
    Player,
    PlayerSeasonStat,
    Team,
    TeamSeasonStat,
)


def read_csv(path: Path, dtypes: dict) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Processed CSV not found: {path}")

    return pd.read_csv(
        path,
        dtype=dtypes,
        encoding="utf-8-sig",
        keep_default_na=True,
    )


def dataframe_records(frame: pd.DataFrame) -> list[dict]:
    return [
        {
            key: None if pd.isna(value) else value
            for key, value in row.items()
        }
        for row in frame.to_dict("records")
    ]


def upsert_rows(
    session,
    model,
    rows: list[dict],
    conflict_columns: list[str],
) -> int:
    if not rows:
        return 0

    statement = insert(model).values(rows)

    update_columns = [
        column.name
        for column in model.__table__.columns
        if column.name not in conflict_columns
    ]

    statement = statement.on_conflict_do_update(
        index_elements=conflict_columns,
        set_={
            column: getattr(statement.excluded, column)
            for column in update_columns
        },
    )

    session.execute(statement)
    return len(rows)


def load_teams(
    session,
    processed_dir: Path,
) -> int:
    frame = read_csv(
        processed_dir / "teams.csv",
        {
            "team_id": "string",
            "name": "string",
        },
    )

    return upsert_rows(
        session,
        Team,
        dataframe_records(frame),
        ["team_id"],
    )


def load_players(
    session,
    processed_dir: Path,
) -> int:
    frame = read_csv(
        processed_dir / "players.csv",
        {
            "player_id": "string",
            "name": "string",
            "nation_code": "string",
            "birth_year": "Int64",
        },
    )

    frame["birth_year"] = frame["birth_year"].astype("Int64")

    return upsert_rows(
        session,
        Player,
        dataframe_records(frame),
        ["player_id"],
    )


def load_team_stats(
    session,
    processed_dir: Path,
) -> int:
    frame = read_csv(
        processed_dir / "team_season_stats.csv",
        {
            "team_id": "string",
            "season": "string",
            "rank": "Int64",
            "matches_played": "Int64",
            "wins": "Int64",
            "draws": "Int64",
            "losses": "Int64",
            "goals_for": "Int64",
            "goals_against": "Int64",
            "goal_difference": "Int64",
            "points": "Int64",
            "points_adjustment": "Int64",
            "points_per_match": "Float64",
            "goals_per_match": "Float64",
            "goals_conceded_per_match": "Float64",
            "clean_sheets": "Int64",
            "shots": "Int64",
            "shots_on_target": "Int64",
            "fouls": "Int64",
            "corners": "Int64",
            "yellow_cards": "Int64",
            "red_cards": "Int64",
            "average_attendance": "Int64",
            "top_scorer_source_text": "string",
            "goalkeeper_source_text": "string",
            "notes": "string",
        },
    )

    integer_columns = [
        "rank",
        "matches_played",
        "wins",
        "draws",
        "losses",
        "goals_for",
        "goals_against",
        "goal_difference",
        "points",
        "points_adjustment",
        "clean_sheets",
        "shots",
        "shots_on_target",
        "fouls",
        "corners",
        "yellow_cards",
        "red_cards",
        "average_attendance",
    ]

    for column in integer_columns:
        frame[column] = frame[column].astype("Int64")

    float_columns = [
        "points_per_match",
        "goals_per_match",
        "goals_conceded_per_match",
    ]

    for column in float_columns:
        frame[column] = frame[column].astype(float)

    return upsert_rows(
        session,
        TeamSeasonStat,
        dataframe_records(frame),
        ["team_id", "season"],
    )


def load_player_stats(
    session,
    processed_dir: Path,
) -> int:
    frame = read_csv(
        processed_dir / "player_season_stats.csv",
        {
            "player_id": "string",
            "team_id": "string",
            "season": "string",
            "position": "string",
            "primary_position": "string",
            "secondary_position": "string",
            "age_at_season_start": "Int64",
            "appearances": "Int64",
            "starts": "Int64",
            "minutes": "Int64",
            "goals": "Int64",
            "assists": "Int64",
            "goal_contributions": "Int64",
            "non_penalty_goals": "Int64",
            "non_penalty_goal_contributions": "Int64",
            "penalties_scored": "Int64",
            "penalties_attempted": "Int64",
            "yellow_cards": "Int64",
            "red_cards": "Int64",
            "goals_per_90": "Float64",
            "assists_per_90": "Float64",
            "goal_contributions_per_90": "Float64",
            "non_penalty_goals_per_90": "Float64",
            "non_penalty_goal_contributions_per_90": "Float64",
        },
    )

    integer_columns = [
        "age_at_season_start",
        "appearances",
        "starts",
        "minutes",
        "goals",
        "assists",
        "goal_contributions",
        "non_penalty_goals",
        "non_penalty_goal_contributions",
        "penalties_scored",
        "penalties_attempted",
        "yellow_cards",
        "red_cards",
    ]

    for column in integer_columns:
        frame[column] = frame[column].astype("Int64")

    float_columns = [
        "goals_per_90",
        "assists_per_90",
        "goal_contributions_per_90",
        "non_penalty_goals_per_90",
        "non_penalty_goal_contributions_per_90",
    ]

    for column in float_columns:
        frame[column] = frame[column].astype(float)

    return upsert_rows(
        session,
        PlayerSeasonStat,
        dataframe_records(frame),
        ["player_id", "team_id", "season"],
    )


def load_matches(
    session,
    processed_dir: Path,
) -> int:
    frame = read_csv(
        processed_dir / "matches.csv",
        {
            "match_id": "string",
            "season": "string",
            "division": "string",
            "match_date": "string",
            "kickoff_local_time": "string",
            "home_team_id": "string",
            "away_team_id": "string",
            "home_goals": "Int64",
            "away_goals": "Int64",
            "result": "string",
            "home_half_time_goals": "Int64",
            "away_half_time_goals": "Int64",
            "half_time_result": "string",
            "referee": "string",
            "home_shots": "Int64",
            "away_shots": "Int64",
            "home_shots_on_target": "Int64",
            "away_shots_on_target": "Int64",
            "home_fouls": "Int64",
            "away_fouls": "Int64",
            "home_corners": "Int64",
            "away_corners": "Int64",
            "home_yellow_cards": "Int64",
            "away_yellow_cards": "Int64",
            "home_red_cards": "Int64",
            "away_red_cards": "Int64",
        },
    )

    frame["match_date"] = pd.to_datetime(
        frame["match_date"],
        format="%Y-%m-%d",
        errors="raise",
    ).dt.date

    integer_columns = [
        column
        for column in frame.columns
        if column.startswith(("home_", "away_"))
        and column not in ["home_team_id", "away_team_id"]
    ]

    for column in integer_columns:
        frame[column] = frame[column].astype("Int64")

    return upsert_rows(
        session,
        Match,
        dataframe_records(frame),
        ["match_id"],
    )


def verify_database(session) -> None:
    expected_counts = {
        "teams": 20,
        "players": 537,
        "team_season_stats": 20,
        "player_season_stats": 551,
        "matches": 380,
    }

    actual_counts = {
        "teams": session.query(Team).count(),
        "players": session.query(Player).count(),
        "team_season_stats": session.query(TeamSeasonStat).count(),
        "player_season_stats": session.query(PlayerSeasonStat).count(),
        "matches": session.query(Match).count(),
    }

    print("\nDatabase row counts:")

    for table_name, actual_count in actual_counts.items():
        expected_count = expected_counts[table_name]
        print(f"{table_name}: {actual_count:,}")

        if actual_count != expected_count:
            raise ValueError(
                f"{table_name}: expected {expected_count:,} rows, "
                f"but found {actual_count:,}"
            )

    top_teams = (
        session.query(TeamSeasonStat)
        .filter(TeamSeasonStat.season == "2025/26")
        .order_by(TeamSeasonStat.rank)
        .limit(5)
        .all()
    )

    print("\nTop five teams:")

    for team_stat in top_teams:
        print(
            f"{team_stat.rank}. {team_stat.team.name}: "
            f"{team_stat.points} points, "
            f"{team_stat.goals_for}-{team_stat.goals_against}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load processed football CSVs into PostgreSQL."
    )

    parser.add_argument(
        "--processed-dir",
        type=Path,
        default=DEFAULT_PROCESSED_DIR,
        help="Folder containing the five cleaned CSV files.",
    )

    arguments = parser.parse_args()
    processed_dir = arguments.processed_dir

    print(f"Loading CSVs from: {processed_dir}")

    # Normally the schema is created by Alembic.
    # This safety check is useful during local development.
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        try:
            loaded_counts = {
                "teams": load_teams(session, processed_dir),
                "players": load_players(session, processed_dir),
                "team_season_stats": load_team_stats(
                    session,
                    processed_dir,
                ),
                "player_season_stats": load_player_stats(
                    session,
                    processed_dir,
                ),
                "matches": load_matches(session, processed_dir),
            }

            session.commit()

            print("\nRows processed:")

            for table_name, row_count in loaded_counts.items():
                print(f"{table_name}: {row_count:,}")

            verify_database(session)

        except Exception:
            session.rollback()
            raise


if __name__ == "__main__":
    main()