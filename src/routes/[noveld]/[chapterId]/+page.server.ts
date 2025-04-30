import { saveProgress } from '$lib/server/db/queries/inserts';
import { getChapter } from '$lib/server/db/queries/select';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const chapterId = parseInt(params.chapterId);
	const novelId = parseInt(params.noveld);
	if (isNaN(chapterId) || isNaN(novelId)) {
		throw new Error('Invalid chapter or novel id');
	}
	return getChapter({ chapter_number: chapterId, novelID: novelId });
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const lastChapterName = formData.get('lastChapterName') as string;
		const chapterNumber = parseInt(formData.get('chapterNumber') as string);
		const novelId = parseInt(event.params.noveld);
		const userId = event.locals.user?.id;
		if (!isNaN(novelId) && !isNaN(chapterNumber) && userId) {
			await saveProgress(userId, novelId, chapterNumber, lastChapterName);
		}
	}
};
