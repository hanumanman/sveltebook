import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import type { RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const sessionCookieName = 'auth-session'

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const token = encodeBase64url(bytes)
  return token
}

export async function createSession(token: string, user_id: number) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const session: table.TInsertSession = {
    id: sessionId,
    user_id,
    expires: new Date(Date.now() + DAY_IN_MS * 30)
  }
  await db.insert(table.sessionTable).values(session)
  return session
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const [result] = await db
    .select({
      // Adjust user table here to tweak returned data
      user: { id: table.usersTable.id, username: table.usersTable.user_name },
      session: table.sessionTable
    })
    .from(table.sessionTable)
    .innerJoin(table.usersTable, eq(table.sessionTable.user_id, table.usersTable.id))
    .where(eq(table.sessionTable.id, sessionId))

  if (!result) {
    return { session: null, user: null }
  }
  const { session, user } = result

  const sessionExpired = Date.now() >= session.expires.getTime()
  if (sessionExpired) {
    await db.delete(table.sessionTable).where(eq(table.sessionTable.id, session.id))
    return { session: null, user: null }
  }

  const renewSession = Date.now() >= session.expires.getTime() - DAY_IN_MS * 15
  if (renewSession) {
    session.expires = new Date(Date.now() + DAY_IN_MS * 30)
    await db
      .update(table.sessionTable)
      .set({ expires: session.expires })
      .where(eq(table.sessionTable.id, session.id))
  }

  return { session, user }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function invalidateSession(sessionId: string) {
  await db.delete(table.sessionTable).where(eq(table.sessionTable.id, sessionId))
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
  event.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })
}

export function deleteSessionTokenCookie(event: RequestEvent) {
  event.cookies.delete(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
}
