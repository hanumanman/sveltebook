import { getNovelFromId } from '$lib/server/db/queries/select';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
  const novelId = parseInt(params.novel);
  if (isNaN(novelId)) {
    error(404, { message: 'Invalid novel id' });
  }
  const novel = await getNovelFromId(novelId);
  if (!novel.id) {
    return error(500, { message: 'Novel not found' });
  }

  return { novel };
};
