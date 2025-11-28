import { getChaptersList } from '$lib/server/db/queries/select'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, params }) => {
    const { novel, progress } = await parent()
    const novelId = parseInt(params.novelId)

    const chapters = await getChaptersList(novelId)

    return {
        novel,
        progress,
        chapters
    }
}
