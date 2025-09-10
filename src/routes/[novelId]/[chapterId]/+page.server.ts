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
    novel: { chapter_count },
    progress
  } = await parent()

  return {
    chapter,
    chapter_count,
    progress
  }
}

export const actions: Actions = {
  progress: async (event) => {
    const formData = await event.request.formData()
    const lastChapterNumber = parseInt(formData.get('lastChapterNumber') as string)
    console.log(lastChapterNumber)

    const chapterName = formData.get('chapterName') as string
    const chapterNumber = parseInt(formData.get('chapterNumber') as string)
    console.log(chapterNumber)

    if (lastChapterNumber >= chapterNumber) {
      return
    }
    const novelId = parseInt(event.params.novelId)
    const userId = event.locals.user?.id
    if (!isNaN(novelId) && !isNaN(chapterNumber) && userId) {
      await saveProgress(userId, novelId, chapterNumber, chapterName)
    }
  }
}
