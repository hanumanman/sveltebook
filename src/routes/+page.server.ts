import { getAllNovels } from '$lib/server/db/queries/select';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params: _ }) => {
	const res = await getAllNovels();
	const novels = res.map((novel) => ({
		...novel,
		novel_genre: novel.novel_genre.split(',')
	}));

	return { novels };
};
