# Startup Fantasy ⚽

A fantasy football game built for the Norwegian startup community. Draft your squad, compete with other founders and teams, and climb the league table.

This repository welcomes contributions from developers of all backgrounds and experience levels. Whether you write Svelte every day or are picking up TypeScript for the first time, the guide below should get you from clone to running app in a few minutes.

## Tech stack

| Area       | Choice                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| Framework  | [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes mode)                        |
| Language   | [TypeScript](https://www.typescriptlang.org/)                                          |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) v4                                            |
| Database   | [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/) |
| Auth       | [Better Auth](https://www.better-auth.com/) (email & password)                         |
| Testing    | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (e2e)     |
| Tooling    | ESLint, Prettier                                                                       |
| Deployment | Node server (`@sveltejs/adapter-node`)                                                 |

## Prerequisites

- [Node.js](https://nodejs.org/) 22 LTS or newer
- [pnpm](https://pnpm.io/) — this project uses pnpm; other package managers are not supported
- [Docker](https://www.docker.com/) for the local PostgreSQL database

## Getting started

```sh
# 1. Install dependencies
pnpm install

# 2. Set up your environment
cp .env.example .env
```

Open `.env` and fill in the values:

- `DATABASE_URL` — already points at the local Docker database; no change needed for local dev.
- `BETTER_AUTH_SECRET` — any random string for local dev. Generate one with `openssl rand -base64 32`.
- `ORIGIN` — leave empty for local development.

```sh
# 3. Start the database (runs in the foreground; use a separate terminal)
pnpm db:start

# 4. Apply the schema to the fresh database
pnpm db:push

# 5. Start the dev server
pnpm dev
```

The app is now running at [http://localhost:5173](http://localhost:5173). Use `pnpm dev --open` to open it automatically.

## Project structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.ts            # Better Auth configuration
│   │   └── db/
│   │       ├── index.ts       # Drizzle client
│   │       ├── schema.ts      # Database schema — edit this
│   │       └── auth.schema.ts # Generated auth tables — do not edit by hand
│   └── assets/
├── routes/                    # Pages and endpoints (file-based routing)
└── hooks.server.ts            # Request hooks (auth session, etc.)
```

## Common tasks

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Start the dev server with hot reload          |
| `pnpm build`     | Build the production app                      |
| `pnpm preview`   | Preview the production build locally          |
| `pnpm check`     | Type-check the project with `svelte-check`    |
| `pnpm lint`      | Check formatting (Prettier) and lint (ESLint) |
| `pnpm format`    | Auto-format the codebase                      |
| `pnpm test`      | Run unit and e2e tests                        |
| `pnpm test:unit` | Run unit tests (Vitest)                       |
| `pnpm test:e2e`  | Run end-to-end tests (Playwright)             |

### Database

The schema lives in `src/lib/server/db/schema.ts`. After editing it:

```sh
pnpm db:push       # Push schema changes directly (fast, for local dev)
pnpm db:studio     # Open Drizzle Studio to browse the database
```

For tracked migrations instead of a direct push:

```sh
pnpm db:generate   # Generate a migration from schema changes
pnpm db:migrate    # Apply pending migrations
```

If you change the auth configuration, regenerate the auth tables:

```sh
pnpm auth:schema
```

## Documentation

- [docs/architecture.md](docs/architecture.md) — high-level architecture and how the pieces fit together.
- [docs/game-mechanics.md](docs/game-mechanics.md) — the game rules and product spec.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide and the engineering principles we follow. In short:

1. Fork the repository and create a branch for your change.
2. Make your change. Add or update tests where it makes sense.
3. Run `pnpm lint` and `pnpm check` before pushing.
4. Open a pull request with a clear description of what changed and why.

New to the codebase? Look for issues labelled `good first issue`. Questions are always welcome — open an issue or start a discussion.
