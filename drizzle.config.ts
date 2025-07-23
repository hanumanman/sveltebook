import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL as string
const authToken = process.env.DATABASE_AUTH_TOKEN as string

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dbCredentials: {
    url,
    authToken
  },
  verbose: true,
  strict: true,
  dialect: 'turso'
})
