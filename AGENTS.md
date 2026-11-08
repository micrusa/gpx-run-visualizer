# GPX Run Visualizer

## Backend

- Spring-boot java monolith under backend/
- Feature-driven organization with MVC pattern under `features` package. DTOs should be under a dtos pkg under each feat pkg
- Entities should be under `domain` package. All entities extend BaseEntity for ID generation
- Exceptions under `exceptions` pkg should be specific and throw the right HTTP error, handled in GlobalExceptionHandler.
- Keep classes single-responsibility. Keep the code clean. Do not overengineer.
- No migrations. ddl-auto: update
- Use `docker compose up -d --build backend` to build new changes.

## Frontend

- NextJS, auto-updates on changes (npm run dev)
- `lib/` contains all services. `lib/api.ts` calls the API, but should not be called directly by the view but indirectly through services.
- `pages/` contains routing and the structure of the pages, but all components must be under `components/{feature}/...`.
- Keep components organized and not excessively big.