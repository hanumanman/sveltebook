import * as auth from '$lib/server/auth/auth.js'
import type { Handle } from '@sveltejs/kit'

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName)

  if (!sessionToken) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  const { session, user } = await auth.validateSessionToken(sessionToken)

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expires)
  } else {
    auth.deleteSessionTokenCookie(event)
  }

  event.locals.user = user
  event.locals.session = session
  return resolve(event)
}

export const handle: Handle = handleAuth
