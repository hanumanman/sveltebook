import { db } from '$lib/server/db'
import { getChapter } from '$lib/server/db/queries/select'
import { type TInsertChapter, chaptersTable } from '$lib/server/db/schema'

import type { Actions } from './$types'

export const actions: Actions = {
  upload: async (event): Promise<void> => {
    const formData = await event.request.formData()
    const text = formData.get('text') as string
    const novelId = formData.get('novelId') as string

    const chapters: TInsertChapter[] = processChapter(text, parseInt(novelId))
    await uploadChapters(chapters)
    console.log('Upload complete.')
  },
  update: async (event): Promise<void> => {
    const formData = await event.request.formData()
    const text = formData.get('text') as string
    const novelId = formData.get('novelId') as string

    const chapters: TInsertChapter[] = processChapter(text, parseInt(novelId))
    await updateChapters(chapters)
    console.log('Upload complete.')
  }
}

function processChapter(text: string, novel_id: number): TInsertChapter[] {
  const chapters = parseChapter(text, novel_id)
  return chapters
}

async function uploadChapters(chapters: TInsertChapter[]) {
  for (const chapter of chapters) {
    db.insert(chaptersTable).values(chapter)
    console.log(`Uploaded chapter ${chapter.chapter_number}: ${chapter.chapter_name}`)
  }
  return
}

async function updateChapters(chapters: TInsertChapter[]) {
  for (const chapter of chapters) {
    const currentChapter = await getChapter({
      novelID: chapter.novel_id,
      chapter_number: chapter.chapter_number
    })
    if (currentChapter) {
      console.log(`Chapter ${chapter.chapter_number} already exists. Skipping upload.`)
      return
    }

    await db.insert(chaptersTable).values(chapter)
    console.log(`Uploaded chapter ${chapter.chapter_number}: ${chapter.chapter_name}`)
  }
  return
}

function parseChapter(text: string, novel_id: number) {
  const chapterRegex = /(?:CHƯƠNG|Chương) (\d+):\s*([^\n]+)/g
  const chapters = []
  let match
  let chapterNumber = 0
  while ((match = chapterRegex.exec(text)) !== null) {
    chapterNumber += 1
    const chapterTitle = match[2].trim()
    const startIndex = match.index + match[0].length
    const endIndex = chapterRegex.lastIndex

    // Find the next chapter start or the end of the string
    const nextMatch = chapterRegex.exec(text)
    const chapterContent = text.slice(startIndex, nextMatch ? nextMatch.index : text.length).trim()

    chapters.push({
      chapter_number: chapterNumber,
      chapter_name: chapterTitle,
      chapter_content: chapterContent,
      novel_id,
      chapter_name_normalized: normalizeVietnamese(chapterTitle)
    })

    // Reset the lastIndex to current endIndex for the next iteration
    chapterRegex.lastIndex = endIndex
  }
  return chapters
}

function normalizeVietnamese(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}
