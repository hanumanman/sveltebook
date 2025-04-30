import { getNovelFromId } from '$lib/server/db/queries/select';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const novelId = parseInt(params.noveld);
	if (isNaN(novelId)) {
		throw new Error('Invalid chapter or novel id');
	}
	return getNovelFromId(novelId);
};
