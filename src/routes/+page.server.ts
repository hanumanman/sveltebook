import { getAllNovels } from '$lib/server/db/queries/select';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const novels = await getAllNovels();

  return { novels };
};
