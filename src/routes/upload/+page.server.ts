import { CHAPTER_PARSING_CONFIG } from '$lib/server/config/chapter'
import { db } from '$lib/server/db'
import { getAllNovels } from '$lib/server/db/queries/select'
import { type TInsertChapter, chaptersTable, novelsTable } from '$lib/server/db/schema'
import { and, eq } from 'drizzle-orm'

import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const novels = await getAllNovels()
  return {
    novels
  }
}

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
    console.log('Update complete.')
  },
  create_novel: async (event) => {
    const formData = await event.request.formData()
    const name = formData.get('name') as string
    const author = formData.get('author') as string
    const description = formData.get('description') as string
    const genre = formData.get('genre') as string
    const image = formData.get('image') as string

    const [newNovel] = await db
      .insert(novelsTable)
      .values({
        novel_name: name,
        novel_author: author,
        novel_description: description,
        novel_genre: genre,
        novel_image_link: image
      })
      .returning({ id: novelsTable.id })

    return { success: true, novelId: newNovel.id }
  }
}

function processChapter(text: string, novel_id: number): TInsertChapter[] {
  const chapters = parseChapter(text, novel_id)
  return chapters
}

async function uploadChapters(chapters: TInsertChapter[]) {
  for (const chapter of chapters) {
    // Check if chapter already exists to avoid unique constraint error
    const existing = await db.query.chaptersTable.findFirst({
      where: (chapters, { and, eq }) =>
        and(
          eq(chapters.novel_id, chapter.novel_id),
          eq(chapters.chapter_number, chapter.chapter_number)
        )
    })

    if (!existing) {
      await db.insert(chaptersTable).values(chapter)
      console.log(`Uploaded chapter ${chapter.chapter_number}: ${chapter.chapter_name}`)
    } else {
      console.log(`Chapter ${chapter.chapter_number} already exists. Skipping.`)
    }
  }
  return
}

async function updateChapters(chapters: TInsertChapter[]) {
  for (const chapter of chapters) {
    const existing = await db.query.chaptersTable.findFirst({
      where: (chapters, { and, eq }) =>
        and(
          eq(chapters.novel_id, chapter.novel_id),
          eq(chapters.chapter_number, chapter.chapter_number)
        )
    })

    if (existing) {
      // Update existing chapter content
      await db
        .update(chaptersTable)
        .set({
          chapter_content: chapter.chapter_content,
          chapter_name: chapter.chapter_name,
          chapter_name_normalized: chapter.chapter_name_normalized
        })
        .where(
          and(
            eq(chaptersTable.novel_id, chapter.novel_id),
            eq(chaptersTable.chapter_number, chapter.chapter_number)
          )
        )
      console.log(`Updated chapter ${chapter.chapter_number}: ${chapter.chapter_name}`)
    } else {
      // Insert new chapter
      await db.insert(chaptersTable).values(chapter)
      console.log(`Uploaded new chapter ${chapter.chapter_number}: ${chapter.chapter_name}`)
    }
  }
  return
}

function parseChapter(text: string, novel_id: number) {
  const chapterRegex = CHAPTER_PARSING_CONFIG.VIETNAMESE_CHAPTER_REGEX
  const chapters = []
  let match
  while ((match = chapterRegex.exec(text)) !== null) {
    const chapterTitle = match[2].trim()
    const startIndex = match.index + match[0].length
    const endIndex = chapterRegex.lastIndex

    const nextMatch = chapterRegex.exec(text)
    const chapterContent = text.slice(startIndex, nextMatch ? nextMatch.index : text.length).trim()

    chapters.push({
      chapter_number: parseInt(match[1]),
      chapter_name: chapterTitle,
      chapter_content: chapterContent,
      novel_id,
      chapter_name_normalized: normalizeVietnamese(chapterTitle)
    })

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
