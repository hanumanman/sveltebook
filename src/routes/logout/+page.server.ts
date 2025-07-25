import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/auth'
import { type Actions, fail, redirect } from '@sveltejs/kit'

export const actions: Actions = {
  default: async (event) => {
    if (event.locals.session === null) {
      return fail(401)
    }
    await invalidateSession(event.locals.session.id)
    deleteSessionTokenCookie(event)
    return redirect(302, '/')
  }
}
