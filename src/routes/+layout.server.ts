import {
  deleteSessionTokenCookie,
  sessionCookieName,
  setSessionTokenCookie,
  validateSessionToken
} from '$lib/server/auth/auth';

import type { PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async (event: RequestEvent) => {
  const token = event.cookies.get(sessionCookieName) ?? null;
  if (token === null) {
    return { session: null, user: null };
  }

  const { session, user } = await validateSessionToken(token);
  if (session === null) {
    deleteSessionTokenCookie(event);
    return new Response(null, {
      status: 401
    });
  }
  setSessionTokenCookie(event, token, session.expires);

  return { session, user };
};
