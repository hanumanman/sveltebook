import { getNovelFromId, getProgress } from '$lib/server/db/queries/select';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const novelId = parseInt(params.novelId);
	if (isNaN(novelId)) {
		error(404, { message: 'Invalid novel id' });
	}
	const novel = await getNovelFromId(novelId);
	if (!novel.id) {
		return error(500, { message: 'Novel not found' });
	}

	const userId = locals.user?.id;
	if (!userId) {
		return { novel, progress: null };
	}

	const progress = await getProgress(novelId, userId);
	return { novel, progress };
};
