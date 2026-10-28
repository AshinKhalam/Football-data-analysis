from pathlib import Path
import argparse
import re

import pandas as pd


SEASON = "2025/26"

INPUT_FILES = {
    "teams": "pl_2025_26_team_stats-3.csv",
    "players": "pl_2025_26_player_stats-2.csv",
    "matches": "pl_2025_26_matches.csv",
}

TEAM_ALIASES = {
    "Manchester Utd": "Manchester United",
    "Man United": "Manchester United",
    "Man Utd": "Manchester United",
    "Man City": "Manchester City",
    "Nottingham": "Nottingham Forest",
    "Nott'm Forest": "Nottingham Forest",
    "Wolves": "Wolverhampton Wanderers",
    "Newcastle": "Newcastle United",
    "Tottenham": "Tottenham Hotspur",
    "West Ham": "West Ham United",
    "Leeds": "Leeds United",
    "Brighton": "Brighton and Hove Albion",
}

TEAM_COLUMNS = {
    "Rk": "rank",
    "Squad": "name",
    "MP": "matches_played",
    "W": "wins",
    "D": "draws",
    "L": "losses",
    "GF": "goals_for",
    "GA": "goals_against",
    "GD": "goal_difference",
    "Pts": "points",
    "Attendance": "average_attendance",
    "Top Team Scorer": "top_scorer_source_text",
    "Goalkeeper": "goalkeeper_source_text",
    "Notes": "notes",
}

PLAYER_COLUMNS = {
    "-9999": "player_id",
    "Player": "name",
    "Nation": "nation",
    "Pos": "position",
    "Squad": "team_name",
    "Age": "age_at_season_start",
    "Born": "birth_year",
    "MP": "appearances",
    "Starts": "starts",
    "Min": "minutes",
    "Gls": "goals",
    "Ast": "assists",
    "G+A": "source_goal_contributions",
    "G-PK": "non_penalty_goals",
    "PK": "penalties_scored",
    "PKatt": "penalties_attempted",
    "CrdY": "yellow_cards",
    "CrdR": "red_cards",
}

MATCH_COLUMNS = {
    "Div": "division",
    "Date": "match_date",
    "Time": "kickoff_local_time",
    "HomeTeam": "home_team_name",
    "AwayTeam": "away_team_name",
    "FTHG": "home_goals",
    "FTAG": "away_goals",
    "FTR": "result",
    "HTHG": "home_half_time_goals",
    "HTAG": "away_half_time_goals",
    "HTR": "half_time_result",
    "Referee": "referee",
    "HS": "home_shots",
    "AS": "away_shots",
    "HST": "home_shots_on_target",
    "AST": "away_shots_on_target",
    "HF": "home_fouls",
    "AF": "away_fouls",
    "HC": "home_corners",
    "AC": "away_corners",
    "HY": "home_yellow_cards",
    "AY": "away_yellow_cards",
    "HR": "home_red_cards",
    "AR": "away_red_cards",
}

PLAYER_COUNTS = [
    "appearances",
    "starts",
    "minutes",
    "goals",
    "assists",
    "non_penalty_goals",
    "penalties_scored",
    "penalties_attempted",
    "yellow_cards",
    "red_cards",
]


def require(condition, message):
    if not bool(condition):
        raise ValueError(message)


def read_csv(path, header=0):
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    df = pd.read_csv(
        path,
        header=header,
        dtype="string",
        encoding="utf-8-sig",
    )

    df = df.dropna(how="all").copy()
    df.columns = df.columns.str.strip()

    for column in df.columns:
        df[column] = (
            df[column]
            .str.strip()
            .replace({"": pd.NA, "—": pd.NA, "N/A": pd.NA})
        )

    return df


def select_columns(df, mapping):
    missing = set(mapping) - set(df.columns)

    require(
        not missing,
        f"Missing source columns: {sorted(missing)}",
    )

    return df[list(mapping)].rename(columns=mapping).copy()


def convert_numbers(df, columns, allow_negative=False):
    for column in columns:
        values = pd.to_numeric(
            df[column].str.replace(",", "", regex=False),
            errors="coerce",
        )

        require(
            values.notna().all(),
            f"Missing or invalid numeric values in {column}",
        )

        require(
            (values % 1 == 0).all(),
            f"Expected whole numbers in {column}",
        )

        if not allow_negative:
            require(
                (values >= 0).all(),
                f"Negative values found in {column}",
            )

        df[column] = values.astype("Int64")


def require_unique(df, columns, label):
    duplicates = df.duplicated(columns, keep=False)

    if duplicates.any():
        examples = df.loc[duplicates, columns].head().to_dict("records")
        raise ValueError(f"Duplicate {label}: {examples}")


def canonical_team(value):
    if pd.isna(value):
        return pd.NA

    value = " ".join(str(value).split())
    return TEAM_ALIASES.get(value, value)


def make_team_id(name):
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        name.lower(),
    ).strip("-")


def attach_team_ids(df, name_column, id_column, lookup):
    names = df[name_column].map(canonical_team)
    df[id_column] = names.map(lookup)

    unknown = names[df[id_column].isna()].drop_duplicates().tolist()

    require(
        not unknown,
        f"Unrecognized teams in {name_column}: {unknown}",
    )


def clean_teams(raw):
    df = select_columns(raw, TEAM_COLUMNS)

    # Remove repeated table headers if present.
    df = df[df["name"].ne("Squad")].copy()

    require(df["name"].notna().all(), "Missing team names")

    df["name"] = df["name"].map(canonical_team)

    require_unique(df, ["name"], "team names")

    convert_numbers(
        df,
        [
            "rank",
            "matches_played",
            "wins",
            "draws",
            "losses",
            "goals_for",
            "goals_against",
            "points",
            "average_attendance",
        ],
    )

    convert_numbers(
        df,
        ["goal_difference"],
        allow_negative=True,
    )

    require(len(df) == 20, "Expected 20 Premier League teams")

    require(
        set(df["rank"]) == set(range(1, 21)),
        "Expected unique ranks from 1 to 20",
    )

    require(
        df["matches_played"].eq(38).all(),
        "Expected 38 matches per team",
    )

    require(
        (
            df["wins"] + df["draws"] + df["losses"]
        ).eq(df["matches_played"]).all(),
        "Team W + D + L does not equal matches played",
    )

    require(
        (
            df["goals_for"] - df["goals_against"]
        ).eq(df["goal_difference"]).all(),
        "Incorrect team goal difference",
    )

    df["team_id"] = df["name"].map(make_team_id)

    require_unique(df, ["team_id"], "team IDs")

    teams = (
        df[["team_id", "name"]]
        .sort_values("team_id")
        .reset_index(drop=True)
    )

    df["season"] = SEASON

    # Preserve published points, including any potential adjustments.
    df["points_adjustment"] = (
        df["points"] - (df["wins"] * 3 + df["draws"])
    )

    df["points_per_match"] = (
        df["points"] / df["matches_played"]
    ).round(6)

    df["goals_per_match"] = (
        df["goals_for"] / df["matches_played"]
    ).round(6)

    df["goals_conceded_per_match"] = (
        df["goals_against"] / df["matches_played"]
    ).round(6)

    stats = (
        df.drop(columns="name")
        .sort_values("rank")
        .reset_index(drop=True)
    )

    return teams, stats


def clean_players(raw, team_lookup):
    df = select_columns(raw, PLAYER_COLUMNS)

    df = df[df["name"].ne("Player")].copy()

    require(
        df.notna().all().all(),
        "Missing required values in player data",
    )

    require(
        df["player_id"].str.fullmatch(r"[0-9a-f]{8}").all(),
        "Invalid source player ID",
    )

    attach_team_ids(
        df,
        "team_name",
        "team_id",
        team_lookup,
    )

    convert_numbers(
        df,
        PLAYER_COUNTS + [
            "birth_year",
            "age_at_season_start",
            "source_goal_contributions",
        ],
    )

    require_unique(
        df,
        ["player_id", "team_id"],
        "player/team rows",
    )

    require(
        df["starts"].le(df["appearances"]).all(),
        "Player starts exceed appearances",
    )

    require(
        df["appearances"].le(38).all(),
        "Player appearances exceed 38 for a club",
    )

    require(
        df["minutes"].le(df["appearances"] * 90).all(),
        "Player minutes exceed appearances multiplied by 90",
    )

    require(
        (
            df["goals"] + df["assists"]
        ).eq(df["source_goal_contributions"]).all(),
        "Player goals + assists mismatch",
    )

    require(
        (
            df["goals"] - df["penalties_scored"]
        ).eq(df["non_penalty_goals"]).all(),
        "Player non-penalty goals mismatch",
    )

    require(
        df["penalties_scored"].le(df["penalties_attempted"]).all(),
        "Penalties scored exceed attempts",
    )

    df["nation_code"] = df["nation"].str.split().str[-1]

    require(
        df["nation_code"].str.fullmatch(r"[A-Z]{3}").all(),
        "Invalid nation code",
    )

    require(
        df["position"].str.fullmatch(r"(?:GK|DF|MF|FW){1,2}").all(),
        "Unexpected position format",
    )

    # One source ID must resolve to one consistent player identity.
    identity_columns = ["name", "nation_code", "birth_year"]

    conflicts = (
        df.groupby("player_id")[identity_columns]
        .nunique(dropna=False)
    )

    require(
        not conflicts.gt(1).any().any(),
        "Conflicting identities for a source player ID",
    )

    players = (
        df[["player_id"] + identity_columns]
        .drop_duplicates()
        .sort_values("player_id")
        .reset_index(drop=True)
    )

    df["season"] = SEASON
    df["primary_position"] = df["position"].str[:2]
    df["secondary_position"] = (
        df["position"].str[2:].replace("", pd.NA)
    )

    df["goal_contributions"] = df["goals"] + df["assists"]

    df["non_penalty_goal_contributions"] = (
        df["non_penalty_goals"] + df["assists"]
    )

    denominator = df["minutes"].replace(0, pd.NA)

    rate_columns = [
        "goals",
        "assists",
        "goal_contributions",
        "non_penalty_goals",
        "non_penalty_goal_contributions",
    ]

    for column in rate_columns:
        df[f"{column}_per_90"] = (
            df[column] * 90 / denominator
        ).round(6)

    stats_columns = [
        "player_id",
        "team_id",
        "season",
        "position",
        "primary_position",
        "secondary_position",
        "age_at_season_start",
    ] + PLAYER_COUNTS + [
        "goal_contributions",
        "non_penalty_goal_contributions",
    ] + [
        f"{column}_per_90"
        for column in rate_columns
    ]

    stats = (
        df[stats_columns]
        .sort_values(["player_id", "team_id"])
        .reset_index(drop=True)
    )

    return players, stats


def expected_result(home_goals, away_goals):
    result = pd.Series("D", index=home_goals.index, dtype="string")
    result.loc[home_goals > away_goals] = "H"
    result.loc[home_goals < away_goals] = "A"
    return result


def clean_matches(raw, team_lookup):
    df = select_columns(raw, MATCH_COLUMNS)

    require(
        len(df) == 380,
        "Expected 380 completed Premier League matches",
    )

    require(
        df["division"].eq("E0").all(),
        "Unexpected competition in matches file",
    )

    attach_team_ids(
        df,
        "home_team_name",
        "home_team_id",
        team_lookup,
    )

    attach_team_ids(
        df,
        "away_team_name",
        "away_team_id",
        team_lookup,
    )

    require(
        df["home_team_id"].ne(df["away_team_id"]).all(),
        "A team cannot play itself",
    )

    require_unique(
        df,
        ["home_team_id", "away_team_id"],
        "home/away fixtures",
    )

    dates = pd.to_datetime(
        df["match_date"],
        format="%d/%m/%Y",
        errors="coerce",
    )

    invalid_dates = dates.isna()

    if invalid_dates.any():
        fixtures = df.loc[
            invalid_dates,
            ["home_team_name", "away_team_name", "match_date"],
        ]

        raise ValueError(
            "Missing or invalid dates. Recover them from a trusted "
            "same-season results file using home/away team matching; "
            "do not forward-fill or guess.\n"
            + fixtures.to_string(index=False)
        )

    require(
        dates.between("2025-07-01", "2026-06-30").all(),
        "Match date outside the expected season window",
    )

    df["match_date"] = dates.dt.strftime("%Y-%m-%d")

    valid_times = df["kickoff_local_time"].str.fullmatch(
        r"(?:[01]\d|2[0-3]):[0-5]\d"
    )

    require(
        valid_times.fillna(False).all(),
        "Missing or invalid kickoff times",
    )

    # Preserve source clock times; do not label them as UTC.
    non_numeric = {
        "home_team_name",
        "away_team_name",
        "home_team_id",
        "away_team_id",
    }

    numeric_columns = [
        column
        for column in df.columns
        if column.startswith(("home_", "away_"))
        and column not in non_numeric
    ]

    convert_numbers(df, numeric_columns)

    for side in ["home", "away"]:
        require(
            df[f"{side}_shots_on_target"].le(
                df[f"{side}_shots"]
            ).all(),
            f"{side}: shots on target exceed total shots",
        )

        require(
            df[f"{side}_half_time_goals"].le(
                df[f"{side}_goals"]
            ).all(),
            f"{side}: half-time goals exceed full-time goals",
        )

    require(
        df["result"].eq(
            expected_result(df["home_goals"], df["away_goals"])
        ).all(),
        "Full-time result does not match score",
    )

    require(
        df["half_time_result"].eq(
            expected_result(
                df["home_half_time_goals"],
                df["away_half_time_goals"],
            )
        ).all(),
        "Half-time result does not match score",
    )

    df["season"] = SEASON

    df["match_id"] = (
        SEASON.replace("/", "-")
        + "__"
        + df["home_team_id"]
        + "__"
        + df["away_team_id"]
    )

    require_unique(df, ["match_id"], "match IDs")

    return (
        df.drop(columns=["home_team_name", "away_team_name"])
        .sort_values(["match_date", "kickoff_local_time", "match_id"])
        .reset_index(drop=True)
    )


def validate_and_enrich_team_stats(team_stats, matches):
    # Temporary in-memory rows only: no extra CSV is created.
    rows = []

    for side, opponent in [("home", "away"), ("away", "home")]:
        part = pd.DataFrame({
            "team_id": matches[f"{side}_team_id"],
            "venue": side,
            "goals_for": matches[f"{side}_goals"],
            "goals_against": matches[f"{opponent}_goals"],
        })

        part["wins"] = (
            part["goals_for"] > part["goals_against"]
        ).astype(int)

        part["draws"] = (
            part["goals_for"] == part["goals_against"]
        ).astype(int)

        part["losses"] = (
            part["goals_for"] < part["goals_against"]
        ).astype(int)

        part["clean_sheets"] = (
            part["goals_against"] == 0
        ).astype(int)

        for metric in [
            "shots",
            "shots_on_target",
            "fouls",
            "corners",
            "yellow_cards",
            "red_cards",
        ]:
            part[metric] = matches[f"{side}_{metric}"]

        rows.append(part)

    appearances = pd.concat(rows, ignore_index=True)
    grouped = appearances.groupby("team_id")

    require(
        grouped.size().eq(38).all(),
        "Expected 38 match records per team",
    )

    for venue in ["home", "away"]:
        counts = (
            appearances[appearances["venue"].eq(venue)]
            .groupby("team_id")
            .size()
        )

        require(
            counts.eq(19).all(),
            f"Expected 19 {venue} matches per team",
        )

    source = team_stats.set_index("team_id")

    for column in [
        "wins",
        "draws",
        "losses",
        "goals_for",
        "goals_against",
    ]:
        calculated = grouped[column].sum().reindex(source.index)

        require(
            source[column].eq(calculated).all(),
            f"Team CSV and matches disagree on {column}",
        )

    enriched = team_stats.copy()

    for column in [
        "clean_sheets",
        "shots",
        "shots_on_target",
        "fouls",
        "corners",
        "yellow_cards",
        "red_cards",
    ]:
        totals = grouped[column].sum()
        enriched[column] = enriched["team_id"].map(totals)

    return enriched


def main(raw_dir, output_dir):
    raw_teams = read_csv(raw_dir / INPUT_FILES["teams"])

    # Row 0 contains group labels; row 1 contains column names.
    raw_players = read_csv(
        raw_dir / INPUT_FILES["players"],
        header=1,
    )

    raw_matches = read_csv(raw_dir / INPUT_FILES["matches"])

    teams, team_stats = clean_teams(raw_teams)

    team_lookup = teams.set_index("name")["team_id"]

    players, player_stats = clean_players(
        raw_players,
        team_lookup,
    )

    matches = clean_matches(
        raw_matches,
        team_lookup,
    )

    team_stats = validate_and_enrich_team_stats(
        team_stats,
        matches,
    )

    require_unique(
        team_stats,
        ["team_id", "season"],
        "team-season rows",
    )

    require_unique(
        player_stats,
        ["player_id", "team_id", "season"],
        "player-team-season rows",
    )

    require(
        player_stats["player_id"].isin(players["player_id"]).all(),
        "Player stats reference an unknown player",
    )

    outputs = {
        "teams.csv": teams,
        "players.csv": players,
        "team_season_stats.csv": team_stats,
        "player_season_stats.csv": player_stats,
        "matches.csv": matches,
    }

    # All transformations and validations finish before writing.
    output_dir.mkdir(parents=True, exist_ok=True)

    for filename, frame in outputs.items():
        frame.to_csv(
            output_dir / filename,
            index=False,
            encoding="utf-8-sig",
        )

        print(f"{filename}: {len(frame):,} rows")

    print("Processing completed successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Clean Premier League 2025/26 CSV exports."
    )

    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=Path("data/raw"),
    )

    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/processed"),
    )

    arguments = parser.parse_args()

    main(arguments.raw_dir, arguments.output_dir)