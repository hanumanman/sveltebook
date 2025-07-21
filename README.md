# Sveltebook

A modern novel reading platform built with SvelteKit.

## Project Overview

Sveltebook is a web application designed for reading novels online. It provides an intuitive interface for readers to discover, browse, and enjoy literature with features for user authentication, bookmarking, and tracking reading progress.

## Features

- User authentication and account management
- Novel browsing and categorization
- Reading progress tracking
- Responsive design for desktop and mobile reading
- Bookmarking and favorites system

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- [Svelte 5](https://svelte.dev/) - Component framework
- [TailwindCSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [LibSQL](https://libsql.org/) - SQLite-compatible database
- [Lucide](https://lucide.dev/) - Icon library
- [Argon2](https://github.com/node-rs/node-rs/tree/main/packages/argon2) - Password hashing

## Development

### Prerequisites

- Node.js (LTS version recommended)
- bun

### Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/sveltebook.git
   cd sveltebook
   ```

2. Install dependencies

   ```bash
   bun install
   ```

3. Start the development server

   ```bash
   bun run dev
   # or start the server and open the app in a new browser tab
   bun run dev -- --open
   ```

### Database Management

This project uses Drizzle ORM with LibSQL. The following commands are available:

```bash
# Push schema changes to the database
bun run db:push

# Run migrations
bun run db:migrate

# Open Drizzle Studio to view/edit database
bun run db:studio
```

## Building for Production

```bash
bun run build
```

You can preview the production build with `bun run preview`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
