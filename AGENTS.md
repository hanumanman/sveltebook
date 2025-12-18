## AGENTS.md

This file provides guidelines for AI agents working on this codebase.

### Build, Lint, and Test

- **Build:** `bun run build` (includes formatting)
- **Lint:** `bun run lint` (prettier check + eslint)
- **Format:** `bun run format` (prettier write)
- **Type Check:** `bun run check` (svelte-kit sync + svelte-check)
- **Test:** No dedicated test script exists. Use `bun run check` for validation. No single-test command available.

### Code Style

- **Framework:** SvelteKit with TypeScript
- **Formatting:** Prettier with config: 100 printWidth, single quotes, no semicolons, no trailing commas, tabs=false
- **Imports:** Sorted with @trivago/prettier-plugin-sort-imports (custom order: @core, @server, @ui, then relative)
- **Naming:** SvelteKit conventions; camelCase for vars/functions; PascalCase for components
- **Types:** Strongly typed TypeScript required; use interfaces for complex objects
- **Error Handling:** try/catch for async ops and DB queries; throw descriptive errors
- **Database:** Drizzle ORM only; schema in src/lib/server/db/schema.ts
- **Authentication:** Lucia auth; config in src/lib/server/auth/auth.ts
- **Styling:** Tailwind CSS; use clsx/tailwind-merge for conditional classes
- **Linting:** ESLint with TS/recommended; ignore unused vars starting with \_
