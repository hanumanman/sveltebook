import { saveProgress } from '$lib/server/db/queries/inserts'
import { getChapter } from '$lib/server/db/queries/select'
import type { TTSData } from '$lib/services/tts.svelte'
import { error } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent, fetch }) => {
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

  async function getTTSData(): Promise<TTSData> {
    return fetch('/api/tts', {
      method: 'POST',
      // TODO: Use stream to handle TTS
      body: JSON.stringify({ text: chapter.chapter_content.split('.')[0] })
    }).then((res) => res.json())
  }

  return {
    chapter,
    chapter_count,
    ttsData: await getTTSData()
  }
}

export const actions: Actions = {
  progress: async (event) => {
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
