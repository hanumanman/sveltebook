<script lang="ts">
  import { enhance } from '$app/forms'
  import { preloadData } from '$app/navigation'
  import Button from '$lib/components/Button.svelte'
  import LinkButton from '$lib/components/LinkButton.svelte'
  import { plainContentToParagraphs, scrollPage } from '$lib/utils'
  import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, List, Settings } from 'lucide-svelte'

  import type { PageProps } from './$types'
  import ChapterListDialog from './ChapterListDialog.svelte'
  import PageSettingsDialog from './PageSettingsDialog.svelte'
  import { pageSettingsStore, themes } from './pageSettingsStore'

  let { data }: PageProps = $props()
  const { chapter_content, chapter_name, chapter_number, novel_id } = $derived(data.chapter)
  const last_chapter_number = $derived(data.progress?.last_chapter_number)
  const prevChapter = $derived(chapter_number - 1)
  const nextChapter = $derived(chapter_number + 1)
  const paragraphs = $derived(plainContentToParagraphs(chapter_content))

  const hasNextChapter = $derived(chapter_number < data.chapter_count)
  const hasPrevChapter = $derived(prevChapter > 0)

  // Reference to the form element
  let progressForm: HTMLFormElement

  function saveProgress() {
    if (progressForm) {
      const formData = new FormData(progressForm)
      const url = progressForm.action

      fetch(url, { method: 'POST', body: formData })
    }
  }

  $effect(() => {
    if (hasNextChapter) {
      preloadData(`/${novel_id}/${nextChapter}`)
    }
    saveProgress()
    scrollPage('top')
  })

  let openSettingsDialog = $state(false)
  function toggleSettingsDialog() {
    openSettingsDialog = !openSettingsDialog
  }

  let openChapterListDialog = $state(false)
  function toggleChapterListDialog() {
    openChapterListDialog = !openChapterListDialog
  }

  // Infinite reading state
  let loadedChapters = $state<
    Array<{ number: number; name: string; content: string; novelId: number }>
  >([])
  let isLoadingNext = $state(false)
  let currentMaxChapter = $state(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chaptersMetadata: any[] = [] // Cache for chapter metadata

  // Initialize loaded chapters with current chapter
  $effect(() => {
    loadedChapters = [
      {
        number: chapter_number,
        name: chapter_name,
        content: chapter_content,
        novelId: novel_id
      }
    ]
    currentMaxChapter = chapter_number
  })

  // Prefetch chapters metadata once
  $effect(() => {
    if ($pageSettingsStore.infiniteReading && chaptersMetadata.length === 0) {
      fetch(`/api/novel/${novel_id}/chapters`)
        .then((res) => res.json())
        .then((chapters) => {
          chaptersMetadata = chapters
        })
        .catch((err) => console.error('Failed to prefetch chapters metadata:', err))
    }
  })

  // Infinite scroll handler
  async function handleScroll() {
    if (!$pageSettingsStore.infiniteReading) return
    if (isLoadingNext) return
    if (currentMaxChapter >= data.chapter_count) return

    const scrollPosition = window.scrollY + window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const threshold = 4000 // pixels from bottom - load earlier for smoother UX

    if (scrollPosition >= documentHeight - threshold) {
      isLoadingNext = true
      const nextChapterNumber = currentMaxChapter + 1

      try {
        // Use cached metadata if available
        const nextChapterData = chaptersMetadata.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ch: any) => ch.chapter_number === nextChapterNumber
        )

        if (nextChapterData) {
          // Fetch full chapter content
          const chapterResponse = await fetch(`/${novel_id}/${nextChapterNumber}`)
          const html = await chapterResponse.text()

          // Parse the response to extract chapter data
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const articleElement = doc.querySelector('article')
          const paragraphs = articleElement?.querySelectorAll('p')
          const content = Array.from(paragraphs || [])
            .map((p) => p.textContent)
            .join('\n\n')

          loadedChapters = [
            ...loadedChapters,
            {
              number: nextChapterNumber,
              name: nextChapterData.chapter_name,
              content: content,
              novelId: novel_id
            }
          ]

          currentMaxChapter = nextChapterNumber

          // Update URL and browser history
          const newUrl = `/${novel_id}/${nextChapterNumber}`
          window.history.pushState({ chapterNumber: nextChapterNumber }, '', newUrl)

          // Update page title
          document.title = `Chapter ${nextChapterNumber}: ${nextChapterData.chapter_name}`

          // Save progress
          saveProgress()
        }
      } catch (error) {
        console.error('Failed to load next chapter:', error)
      } finally {
        isLoadingNext = false
      }
    }
  }

  // Add scroll listener
  $effect(() => {
    if ($pageSettingsStore.infiniteReading) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  })

  async function generateTTVoice(text: string) {
    const res = await fetch('/api/tiktok-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chapter_content })
    })

    if (!res.ok) {
      const error = await res.json().then((data) => data.error)
      return alert(error)
    }

    const blob = await res.blob()

    const audio = new Audio()
    audio.src = URL.createObjectURL(blob)
    await audio.play()

    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audio.src)
    })
  }
</script>

<svelte:head>
  <title>{`Chapter ${chapter_number}: ${chapter_name}`}</title>
  <meta name="description" content={`Chapter ${chapter_number}: ${chapter_name}`} />
</svelte:head>

<PageSettingsDialog open={openSettingsDialog} toggleDialogFn={toggleSettingsDialog} />
<ChapterListDialog
  open={openChapterListDialog}
  toggleDialogFn={toggleChapterListDialog}
  novelId={novel_id}
  currentChapterNumber={chapter_number}
/>

<div
  class="mx-auto flex w-full max-w-lg flex-col justify-between p-2 sm:p-4"
  style="background-color: {themes[$pageSettingsStore.theme].background}; color: {themes[
    $pageSettingsStore.theme
  ].color};"
>
  <!-- Back to Novel Link -->
  <a
    href="/{novel_id}"
    class="mb-4 sm:mb-6 inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
  >
    <ChevronLeft size={18} class="sm:w-5 sm:h-5" />
    <span>Back to Novel</span>
  </a>

  <!-- Chapter Title -->
  <div class="mb-4 sm:mb-6 gap-4 border-b border-gray-500 pb-4 sm:pb-6">
    <div>
      <h1 class="pb-2 sm:pb-3 text-base sm:text-xl text-gray-600 dark:text-gray-400">
        Chapter {chapter_number}
      </h1>
      <h2 class="mb-1 text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{chapter_name}</h2>
    </div>

    <!-- Page Controls -->
    <div class="flex flex-wrap justify-end gap-1.5 sm:gap-2 pt-3">
      <!-- <TTSButton
        text={chapter_content}
        nextPageUrl={`/${novel_id}/${nextChapter}`}
        title={data.novel.novel_name}
        chapterTitle={`Chapter ${chapter_number}: ${chapter_name}`}
      /> -->

      <button
        onclick={() => generateTTVoice(chapter_content)}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
        title="TTS Btn"
      >
        test
      </button>
      <button
        onclick={toggleChapterListDialog}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
        title="Chapter List"
      >
        <List size={18} class="sm:w-5 sm:h-5" />
      </button>

      <button
        onclick={toggleSettingsDialog}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
        title="Open Settings Dialog"
      >
        <Settings size={18} class="sm:w-5 sm:h-5" />
      </button>
      <button
        onclick={() => scrollPage('bottom')}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
        title="Scroll to Bottom"
      >
        <ChevronDown size={18} class="sm:w-5 sm:h-5" />
      </button>

      {#if hasPrevChapter}
        <a
          href="/{novel_id}/{prevChapter}"
          class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
          title="Previous Chapter"
        >
          <ChevronLeft size={18} class="sm:w-5 sm:h-5" />
        </a>
      {/if}

      {#if hasNextChapter}
        <a
          href="/{novel_id}/{nextChapter}"
          class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700"
          title="Next Chapter"
        >
          <ChevronRight size={18} class="sm:w-5 sm:h-5" />
        </a>
      {/if}
    </div>
  </div>

  <!-- Chapter Content -->
  {#if $pageSettingsStore.infiniteReading && loadedChapters.length > 0}
    <!-- Render all loaded chapters -->
    {#each loadedChapters as chap, idx (chap.number)}
      {#if idx > 0}
        <!-- Chapter separator for subsequent chapters -->
        <div class="my-8 border-t-2 border-gray-500 pt-6">
          <h2 class="text-base sm:text-xl text-gray-600 dark:text-gray-400 mb-2">
            Chapter {chap.number}
          </h2>
          <h3 class="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-4">{chap.name}</h3>
        </div>
      {/if}

      <article
        style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};"
        class="prose prose-lg dark:prose-invert max-w-none pb-4"
      >
        {#each plainContentToParagraphs(chap.content) as paragraph, i (i)}
          <p class="mb-6">{paragraph}</p>
        {/each}
      </article>
    {/each}

    <!-- End of book message -->
    {#if currentMaxChapter >= data.chapter_count}
      <div class="flex justify-center pb-3 pt-8">
        <span>You have caught up!</span>
      </div>
    {/if}
    <!-- End of book message -->
    {#if currentMaxChapter >= data.chapter_count}
      <div class="flex justify-center pb-3 pt-8">
        <span>You have caught up!</span>
      </div>
    {/if}
  {:else}
    <!-- Single chapter mode (default behavior) -->
    <article
      style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};"
      class="prose prose-lg dark:prose-invert max-w-none pb-4"
    >
      {#each paragraphs as paragraph, i (i)}
        <p class="mb-6">{paragraph}</p>
      {/each}
    </article>

    {#if !hasNextChapter}
      <div class="flex justify-center pb-3">
        <span>You have caught up!</span>
      </div>
    {/if}
  {/if}

  <!-- Bottom Chapter Navigation (hidden in infinite reading mode) -->
  {#if !$pageSettingsStore.infiniteReading}
    <div class="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:pt-4 dark:border-gray-700">
      {#if hasNextChapter}
        <LinkButton
          class="border border-gray-700 text-sm sm:text-base"
          href="/{novel_id}/{nextChapter}"
        >
          Next Chapter
          <ChevronRight size={18} class="sm:w-5 sm:h-5" />
        </LinkButton>
      {:else}
        <div></div>
      {/if}

      {#if hasPrevChapter}
        <LinkButton
          href="/{novel_id}/{prevChapter}"
          class="bg-pennBlue-900 w-full border border-gray-700 text-sm sm:text-base"
        >
          <div class="flex items-center gap-2">
            <ChevronLeft size={18} class="sm:w-5 sm:h-5" />
            <span>Previous Chapter</span>
          </div>
        </LinkButton>
      {:else}
        <div></div>
      {/if}
      <Button
        class="bg-pennBlue-900 w-full border border-gray-700 text-sm sm:text-base"
        onclick={() => scrollPage('top')}
      >
        <span>Go to Top</span>
        <ChevronUp size={18} class="sm:w-5 sm:h-5" />
      </Button>
    </div>
  {/if}
</div>

<!-- Hidden form to store progress values -->
<form action="?/progress" class="hidden" method="POST" use:enhance bind:this={progressForm}>
  <input type="text" name="lastChapterNumber" value={last_chapter_number} />
  <input type="text" name="chapterName" value={chapter_name} />
  <input type="text" name="chapterNumber" value={chapter_number} />
</form>
