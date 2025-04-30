import { getChapter } from '$lib/server/db/queries/select';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const chapterId = parseInt(params.chapterId);
	const novelId = parseInt(params.noveld);
	if (isNaN(chapterId) || isNaN(novelId)) {
		throw new Error('Invalid chapter or novel id');
	}
	return getChapter({ chapter_number: chapterId, novelID: novelId });
};
