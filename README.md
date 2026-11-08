# GPX Run Visualizer

Next.js + TypeScript, Spring Boot (Java 21), and PostgreSQL.

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
- Auth is implemented; imports, charts (weekly graphs/trends), and run view are stubs.
- Hibernate updates the database schema automatically (`ddl-auto: update`).
