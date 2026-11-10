# GPX Run Visualizer

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