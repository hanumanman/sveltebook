import { getAllNovels } from '$lib/server/db/queries/select';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/auth';

export const load: PageServerLoad = async () => {
	const res = await getAllNovels();
	const novels = res.map((novel) => ({
		...novel,
		novel_genre: novel.novel_genre.split(',')
	}));

	return { novels };
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session === null) {
			return fail(401);
		}
		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, '/');
	}
};
