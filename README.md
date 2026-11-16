# GPX Run Visualizer

Import GPX files and explore your runs with an interactive map and linked charts for pace, elevation, grade, and heart rate when available. Select a section to see its stats or compare two metrics.

Next.js + TypeScript, Spring Boot (Java 21), and PostGIS (PostgreSQL 17).

## Development

```sh
docker compose up --build
```

Open http://localhost:3000. Create an account at `/login`.
Frontend edits reload automatically. After backend changes:

```sh
docker compose up -d --build backend
```

Copy `.env.example` to `.env` to customize ports and database credentials.
Stop with `docker compose down`, database data persists.
