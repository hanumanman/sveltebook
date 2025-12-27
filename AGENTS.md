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

## MCP

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
