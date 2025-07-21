import { saveProgress } from '$lib/server/db/queries/inserts'
import { getChapter } from '$lib/server/db/queries/select'
import { error } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
  const chapterId = parseInt(params.chapterId)
  const novelId = parseInt(params.novelId)
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

  return { chapter, chapter_count }
}

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData()
    const lastChapterName = formData.get('lastChapterName') as string
    const chapterNumber = parseInt(formData.get('chapterNumber') as string)
    const novelId = parseInt(event.params.novelId)
    const userId = event.locals.user?.id
    if (!isNaN(novelId) && !isNaN(chapterNumber) && userId) {
      await saveProgress(userId, novelId, chapterNumber, lastChapterName)
    }
  }
}
