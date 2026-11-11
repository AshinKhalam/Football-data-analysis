# Football Data Analysis

Live demo: https://football-data-analysis-zku8.onrender.com

## Screenshots

## About

A full-stack Premier League statistics dashboard for exploring team performance, searching player statistics, and comparing teams and players across the 2025/26 season.
Built as a portfolio project to demonstrate frontend development, API integration, database-backed applications, and interactive data visualisation.

## Features

- Premier League standings with selectable teams.
- Team season statistics and interactive charts.
- Player search, club filtering, and pagination.
- Individual player statistics and club breakdowns.
- Side-by-side team comparisons.
- Player comparisons using season totals and per-90 figures.
- Default player selections for comparison.
- Light and dark themes.
- Responsive layouts for mobile and desktop.
- Automatic scrolling to analysis after results load.
- Loading, empty, and API-error states.

## Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Recharts
- Vite

### Backend
- FastAPI
- SQLAlchemy
- Alembic

### Database
- PostgreSQL

### Deployment
- Render
- Neon

## Architecture

```text
React + TypeScript frontend
            ↓ HTTP requests
       FastAPI backend
            ↓ SQLAlchemy
     PostgreSQL on Neon
```

## Running Locally

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL (or a Neon connection string)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/football_analytics
```

Start the API:

```bash
uvicorn app.main:app --reload
```

Open `http://localhost:5173`



## Data Sources

The application uses a static 2025/26 Premier League dataset.

- Match results: [Football-Data.co.uk](https://www.football-data.co.uk/)
- Player statistics and team standings: [FBref](https://fbref.com/)

The data was imported into PostgreSQL and is served through the application’s FastAPI backend.

## Deployment

The frontend and backend are deployed on Render, with PostgreSQL hosted on Neon.

- The frontend is built as a static Vite site and served from `dist/`.
- The backend is a FastAPI service started with Uvicorn.
- The frontend uses environment variable `VITE_API_BASE_URL` to connect to the deployed API.
- The backend uses environment variable `DATABASE_URL` to connect to PostgreSQL.

Environment variables are configured privately in Render and are not stored in the repository.

## Known Limitations

- The application uses a static 2025/26 Premier League dataset; statistics and results do not update automatically.
- The dataset does not include detailed goalkeeper metrics, so goalkeeper performance is not fully represented in player comparisons.
- The free-tier hosting may have cold starts or slower response times after periods of inactivity.
