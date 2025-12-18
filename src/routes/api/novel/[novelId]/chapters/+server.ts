import { getChaptersList } from '$lib/server/db/queries/select'
import { json } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const novelId = parseInt(params.novelId)
  if (isNaN(novelId)) {
    return json({ error: 'Invalid novel ID' }, { status: 400 })
  }

  try {
    const chapters = await getChaptersList(novelId)
    return json(chapters)
  } catch (e) {
    console.error(e)
    return json({ error: 'Failed to fetch chapters' }, { status: 500 })
  }
}
