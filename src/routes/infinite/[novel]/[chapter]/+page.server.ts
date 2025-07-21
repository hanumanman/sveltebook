import { getChapter } from '$lib/server/db/queries/select'
import { plainContentToParagraphs } from '$lib/utils'
import { error } from '@sveltejs/kit'

import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
  const chapterId = parseInt(params.chapter)
  const novelId = parseInt(params.novel)
  if (isNaN(chapterId) || isNaN(novelId)) {
    error(404, { message: 'Invalid chapter or novel id' })
  }
  const chapter = await getChapter({ chapter_number: chapterId, novelID: novelId })

  if (!chapter) {
    return error(500, { message: 'Chapter not found' })
  }

  const {
    novel: { chapter_count }
  } = await parent()

  return {
    chapter: { ...chapter, paragraphs: plainContentToParagraphs(chapter.chapter_content) },
    chapter_count
  }
}
