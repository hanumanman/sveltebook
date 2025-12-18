<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import LinkButton from '$lib/components/LinkButton.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { List } from 'lucide-svelte'

  import type { PageProps } from './$types'
  import ChapterListDialog from './[chapterId]/ChapterListDialog.svelte'

  let { data }: PageProps = $props()
  const { novel, progress, chapters } = $derived(data)
  const {
    chapter_count,
    id,
    novel_author,
    novel_description,
    novel_genre,
    novel_image_link,
    novel_name
  } = $derived(novel)

  const genres: string[] = $derived(novel_genre.split(','))
  const percent: number = $derived(
    !progress?.last_chapter_number
      ? 0
      : Math.round((progress?.last_chapter_number / chapter_count) * 100)
  )

  // Show latest 20 chapters
  const displayedChapters = $derived(chapters.slice(0, 20))

  let openChapterListDialog = $state(false)
  function toggleChapterListDialog() {
    openChapterListDialog = !openChapterListDialog
  }
</script>

<svelte:head>
  <title>{novel_name}</title>
  <meta name="description" content={novel_description} />
</svelte:head>

<ChapterListDialog
  open={openChapterListDialog}
  toggleDialogFn={toggleChapterListDialog}
  novelId={id}
  currentChapterNumber={progress?.last_chapter_number || 1}
/>

<div class="min-h-[70dvh] px-4 py-6">
  <div class="flex flex-col gap-6 md:flex-row">
    <!-- Novel Cover Image -->
    <div class="md:w-1/3 lg:w-1/4">
      <enhanced:img
        class="h-64 w-full rounded-md object-cover shadow-lg md:h-auto"
        src={novel_image_link || ''}
        alt={`Cover of ${novel_name}`}
      />
    </div>

    <!-- Novel Details -->
    <div class="flex-1">
      <h1 class="mb-2 text-2xl font-bold break-words text-gray-50 sm:text-3xl">
        {novel_name}
      </h1>
      <p class="text-chocolateCosmos-50 mb-4 text-sm font-medium">
        by <span class="font-semibold">{novel_author}</span>
      </p>

      <div class="mb-4 flex w-full flex-wrap gap-2">
        {#each genres as genre, i (i)}
          <span
            class="border-burgundy-500 text-burgundy-200 inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-xs font-medium whitespace-nowrap sm:text-sm"
          >
            {genre}
          </span>
        {/each}

        <span
          class="border-caribbeanCurrent-800 text-caribbeanCurrent-200 inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-xs font-medium sm:text-sm"
        >
          {chapter_count}
          {chapter_count === 1 ? 'Chapter' : 'Chapters'}
        </span>
      </div>

      <div class="mt-4">
        <h2 class="mb-2 text-lg font-semibold text-gray-100">Description</h2>
        <p class="text-sm leading-relaxed text-gray-300 sm:text-base">
          {novel_description}
        </p>
      </div>
      {#if progress?.last_chapter_number}
        <div class="p-6 mt-4 rounded-lg border border-gray-500">
          <p class="text-lg font-semibold">You have finished {percent}% of the book!</p>
          <ProgressBar
            class="mt-4"
            value={progress?.last_chapter_number || 0}
            maxValue={chapter_count}
          />
        </div>
        <div class="mt-6">
          <LinkButton href={`/${id}/${progress.last_chapter_number}`}>
            Resume chapter {progress.last_chapter_number}: {progress?.last_chapter_name}
          </LinkButton>
        </div>
      {/if}

      <div class="mt-6">
        <LinkButton href={`/${id}/1`}>Start Reading</LinkButton>
      </div>

      <!-- Chapter List -->
      {#if chapters && chapters.length > 0}
        <div class="mt-10 border-t border-gray-700 pt-8">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-100">Latest Chapters</h2>
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-400">{chapters.length} total</span>
              {#if chapters.length > 20}
                <Button
                  class="flex items-center gap-2 bg-blue-900/30 border border-blue-800/50 hover:bg-blue-900/50"
                  onclick={toggleChapterListDialog}
                >
                  <List size={16} />
                  <span>View All Chapters</span>
                </Button>
              {/if}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {#each displayedChapters as chapter (chapter.id)}
              <a
                href={`/${id}/${chapter.chapter_number}`}
                class="group flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50 p-3 transition-all hover:border-blue-500/50 hover:bg-gray-800 hover:shadow-md hover:shadow-blue-900/10"
              >
                <span
                  class="mb-2 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-900 text-xs font-mono font-medium text-gray-500 group-hover:text-blue-400"
                >
                  {chapter.chapter_number}
                </span>
                <span
                  class="line-clamp-2 text-xs font-medium text-gray-300 group-hover:text-white leading-tight"
                >
                  {chapter.chapter_name}
                </span>
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
