# AGENTS.md

Guidelines for AI coding agents working in this codebase.

---

## Quick Reference

### Package Manager

**Bun** is the package manager and runtime. Use `bun` for all commands.

### Core Commands

| Command          | Description                                |
| ---------------- | ------------------------------------------ |
| `bun run dev`    | Start development server                   |
| `bun run build`  | Build for production (includes formatting) |
| `bun run format` | Format code with Prettier                  |
| `bun run lint`   | Run Prettier check + ESLint                |
| `bun run check`  | Type-check with svelte-check               |

### Database Commands

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `bun run db:push`    | Push schema changes to database |
| `bun run db:migrate` | Run database migrations         |

### Testing

⚠️ **No test framework configured.** Use `bun run check` for type validation.
**No single-test command available.**

---

## Project Architecture

### Framework & Tech Stack

- **Framework:** SvelteKit 2.x with Svelte 5 (runes)
- **Runtime:** Bun
- **Language:** TypeScript (strict mode)
- **Database:** Turso (libSQL) with Drizzle ORM
- **Authentication:** Custom Oslo-based auth (sha256 sessions)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel (adapter-auto configured)

### Directory Structure

```
src/
├── lib/
│   ├── components/       # Svelte components
│   ├── server/           # Server-only code
│   │   ├── auth/         # Authentication logic
│   │   ├── db/           # Database schema & queries
│   │   └── config/       # Server configuration
│   ├── services/         # Business logic
│   └── utils/            # Shared utilities
└── routes/               # SvelteKit file-based routing
    ├── api/              # API endpoints (+server.ts)
    └── [novelId]/        # Dynamic routes
```

---

#### Type Imports

Use `import type` for type-only imports:

```typescript
import type { PageServerLoad } from './$types'
import type { RequestHandler } from './$types'
```

### Naming Conventions

| Type             | Convention                                   | Example                                    |
| ---------------- | -------------------------------------------- | ------------------------------------------ |
| Variables        | camelCase                                    | `novelId`, `chapterContent`                |
| Functions        | camelCase                                    | `getAllNovels()`, `validateSessionToken()` |
| Components       | PascalCase                                   | `Button.svelte`, `Header.svelte`           |
| Types/Interfaces | PascalCase with prefix                       | `TSelectNovel`, `TInsertChapter`           |
| Constants        | UPPER_SNAKE_CASE                             | `DAY_IN_MS`, `TIKTOK_CONFIG`               |
| Files            | kebab-case (routes), PascalCase (components) | `+page.server.ts`, `Button.svelte`         |

### Error Handling

#### API Routes (`+server.ts`)

Use try/catch with descriptive JSON errors:

```typescript
export const GET: RequestHandler = async ({ params }) => {
  const novelId = parseInt(params.novelId)
  if (isNaN(novelId)) {
    return json({ error: 'Invalid novel ID' }, { status: 400 })
  }

  try {
    const chapters = await getChaptersList(novelId)
    return json(chapters)
  } catch (e) {
    console.error(e)
    return json({ error: 'Failed to fetch chapters' }, { status: 500 })
  }
}
```

#### Server Load Functions

Use SvelteKit's `error()` helper:

```typescript
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params }) => {
  const novel = await getNovelById(parseInt(params.novelId))
  if (!novel) {
    error(404, 'Novel not found')
  }
  return { novel }
}
```

---

## Database (Drizzle ORM)

### Schema Location

`src/lib/server/db/schema.ts`

### Type Inference

Always use Drizzle's type inference:

```typescript
export type TInsertChapter = typeof chaptersTable.$inferInsert
export type TSelectChapter = typeof chaptersTable.$inferSelect
```

### Query Patterns

- Use `src/lib/server/db/queries/select.ts` for SELECT queries
- Use `src/lib/server/db/queries/inserts.ts` for INSERT/UPDATE queries
- Always use parameterized queries (Drizzle handles this)

---

## Authentication

### Custom Auth System

- Located in `src/lib/server/auth/auth.ts`
- Uses Oslo's crypto primitives (sha256 hashing)
- Session-based with 30-day expiration
- Cookie name: `auth-session`

### Key Functions

- `generateSessionToken()` - Create new session token
- `createSession(token, user_id)` - Store session in DB
- `validateSessionToken(token)` - Validate and return user

---

## Svelte 5 Specifics

### Runes

This project uses **Svelte 5 runes** (modern reactivity):

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects
- `$props()` for component props

## MCP Tools (Svelte Documentation)

When working with Svelte/SvelteKit, use these MCP tools:

1. **`list-sections`** - Discover available docs (use FIRST)
2. **`get-documentation`** - Fetch specific sections (analyze use_cases)
3. **`svelte-autofixer`** - Validate Svelte code (call until clean)
4. **`playground-link`** - Generate playground link (ask user first)

**Workflow:** list-sections → analyze use_cases → get-documentation → svelte-autofixer
