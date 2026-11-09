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
Stop with `docker compose down`; database data persists.

## Structure

- `frontend/src/`: pages, components, lib, styles.
- `backend/src/main/java/ch/unibas/gpxrunviz/`: features (auth DTOs in `auth/dtos`), domain models, config, exceptions.
- Auth and bulk GPX imports are implemented; charts and run view are stubs.
- Hibernate updates the database schema automatically (`ddl-auto: update`).

Import GPX files in bulk at `/imports`, without application-imposed upload caps.
Each file commits independently; invalid files appear with an error in the latest
50 imports. Each track becomes a run. Points use PostGIS `geometry(Point,4326)`
(longitude, latitude). Existing database data is preserved; startup enables PostGIS.
Summaries store horizontal distance, elapsed time/pace (including pauses), raw
elevation gain/loss, and sample-average heart rate. Segment gaps are not joined;
missing sensors/timestamps remain null rather than being estimated.
