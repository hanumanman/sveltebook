import {
  deleteSessionTokenCookie,
  sessionCookieName,
  setSessionTokenCookie,
  validateSessionToken
} from '$lib/server/auth/auth'

import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  const token = event.cookies.get(sessionCookieName) ?? null
  if (token === null) {
    return { session: null, user: null }
  }

  const { session, user } = await validateSessionToken(token)
  if (session === null) {
    deleteSessionTokenCookie(event)
    return { session: null, user: null }
  }

  setSessionTokenCookie(event, token, session.expires)
  return { session, user }
}
