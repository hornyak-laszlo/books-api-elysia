# Books API

A REST API for managing books, genres, and reviews. Built with [Elysia](https://elysiajs.com/) on [Bun](https://bun.sh/), backed by PostgreSQL via [Prisma](https://www.prisma.io/), with [Zod](https://zod.dev/) validation and auto-generated OpenAPI docs.

## Stack

- **Runtime**: Bun
- **Framework**: Elysia + `@elysiajs/openapi` + `@elysiajs/cors` + `logixlysia` (request logging)
- **Database**: PostgreSQL (Prisma ORM)
- **Validation**: Zod (via Elysia's Standard Schema support)
- **Linter/Formatter**: Biome

## Getting Started

```sh
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.template .env
# Edit .env and set DATABASE_URL

# 3. Apply database migrations
bunx prisma migrate deploy --config prisma.config.ts

# 4. Start dev server (hot reload)
bun run dev
```

Server runs at http://localhost:3000

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun run test` | Run the Bun test suite |
| `bun run tsc` | Type-check without emitting |
| `bun run check` | Lint and format with Biome (auto-fix) |
| `bun run api-test` | Run Postman/Newman integration tests |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/books` | List all books |
| `POST` | `/books` | Create a book |
| `GET` | `/books/:id` | Get a book by ID |
| `PATCH` | `/books/:id` | Update a book |
| `DELETE` | `/books/:id` | Delete a book |
| `GET` | `/genres` | List all genres |
| `POST` | `/genres` | Create a genre |
| `GET` | `/reviews` | List all reviews |
| `POST` | `/reviews` | Create a review |
| `DELETE` | `/reviews/:id` | Delete a review |

### Docs

- **ReDoc UI**: http://localhost:3000/redoc
- **OpenAPI spec**: http://localhost:3000/doc

## Project Structure

```
src/
  index.ts          # App entry, plugins, global error handler
  lib/
    prisma.ts       # Prisma client singleton
    errorUtils.ts   # Shared error response schemas (used in docs)
  books/            # dto.ts · repository.ts · routes.ts
  genres/           # dto.ts · repository.ts · routes.ts
  reviews/          # dto.ts · repository.ts · routes.ts
  reset-db/         # routes.ts
prisma/
  schema.prisma     # Database schema
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: `3000`) |

## Testing

Added tests based on Postman collection. To run them:

```sh
bun test --coverage
```
