import { getNovelFromId, getProgress } from '$lib/server/db/queries/select';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const novelId = parseInt(params.novelId);
	if (isNaN(novelId)) {
		throw new Error('Invalid chapter or novel id');
	}
	const novel = await getNovelFromId(novelId);
	const userId = locals.user?.id;
	if (!userId) {
		return { novel, progress: null };
	}
	const progress = await getProgress(novelId, userId);
	return { novel, progress };
};
