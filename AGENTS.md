## AGENTS.md

This file provides guidelines for AI agents working on this codebase.

### Build, Lint, and Test

- **Build:** `bun run build`
- **Lint:** `bun run lint`
- **Format:** `bun run format`
- **Type Check:** `bun run check`
- **Test:** This project does not have a dedicated test script. Please use `bun run check` to validate changes.

### Code Style

- **Framework:** SvelteKit
- **Formatting:** Use Prettier (`bun run format`). Adhere to the existing `.prettierrc` configuration.
- **Imports:** Use `@trivago/prettier-plugin-sort-imports` for import sorting.
- **Naming:** Follow Svelte/SvelteKit conventions for component and file naming. Use camelCase for variables and functions.
- **Types:** This project uses TypeScript. Ensure all new code is strongly typed.
- **Error Handling:** Use try/catch blocks for asynchronous operations and database queries.
- **Database:** Use Drizzle ORM for all database interactions. Schema is defined in `src/lib/server/db/schema.ts`.
- **Authentication:** Use Lucia for authentication. Configuration is in `src/lib/server/auth/auth.ts`.
- **Styling:** Use Tailwind CSS for styling.
