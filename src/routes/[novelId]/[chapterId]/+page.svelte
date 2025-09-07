<script lang="ts">
  import { browser } from '$app/environment'
  import { enhance } from '$app/forms'
  import { goto, preloadData } from '$app/navigation'
  import Button from '$lib/components/Button.svelte'
  import LinkButton from '$lib/components/LinkButton.svelte'
  import TextReader from '$lib/services/textReader.svelte'
  import { plainContentToParagraphs, scrollPage } from '$lib/utils'
  import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Play,
    Settings,
    Volume2
  } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  import type { PageProps } from './$types'
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
  const tts = TextReader.getInstance()

  function gotoNextPage() {
    goto(`/${novel_id}/${nextChapter}`)
  }

  function handleClick() {
    switch (tts.getState) {
      case 'paused':
        tts.resume()
        break
      case 'playing':
        tts.pause()
        break
      case 'stopped':
        tts.play(chapter_content.split('.')[0], gotoNextPage)
        break
      default:
        break
    }
  }

  let autoplay = $state(browser ? localStorage.getItem('autoplay') === 'true' : false)

  $effect(() => {
    if (!browser) return
    localStorage.setItem('autoplay', autoplay.toString())
  })

  onMount(() => {
    if (!browser) return
    if (autoplay) {
      tts.play(chapter_content)
    }
  })

  onDestroy(() => {
    tts.stop()
  })
</script>

<svelte:head>
  <title>{`Chapter ${chapter_number}: ${chapter_name}`}</title>
  <meta name="description" content={`Chapter ${chapter_number}: ${chapter_name}`} />
</svelte:head>

<PageSettingsDialog open={openSettingsDialog} toggleDialogFn={toggleSettingsDialog} />

<div
  class="mx-auto flex w-full max-w-lg flex-col justify-between p-4"
  style="background-color: {themes[$pageSettingsStore.theme].background}; color: {themes[
    $pageSettingsStore.theme
  ].color};"
>
  <!-- Back to Novel Link -->
  <a
    href="/{novel_id}"
    class="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
  >
    <ChevronLeft size={20} />
    <span>Back to Novel</span>
  </a>

  <!-- Chapter Title -->
  <div class="mb-6 gap-4 border-b border-gray-500 pb-6">
    <div>
      <h1 class="pb-3 text-xl text-gray-600 dark:text-gray-400">Chapter {chapter_number}</h1>
      <h2 class="mb-1 text-3xl font-bold">{chapter_name}</h2>
    </div>

    <!-- Page Controls -->
    <div class="flex justify-end gap-2 pt-3">
      <label class="flex gap-1 items-center">
        <input type="checkbox" bind:checked={autoplay} />
        Autoplay
      </label>

      <button
        onclick={handleClick}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
        title="Play button"
      >
        {#if tts?.getState === 'playing'}
          <Volume2 class="animate-pulse" size={20} />
        {:else}
          <Play size={20} />
        {/if}
      </button>

      <button
        onclick={toggleSettingsDialog}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
        title="Open Settings Dialog"
      >
        <Settings size={20} />
      </button>
      <button
        onclick={() => scrollPage('bottom')}
        class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
        title="Scroll to Bottom"
      >
        <ChevronDown size={20} />
      </button>

      {#if hasPrevChapter}
        <a
          href="/{novel_id}/{prevChapter}"
          class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
          title="Previous Chapter"
        >
          <ChevronLeft size={20} />
        </a>
      {/if}

      {#if hasNextChapter}
        <a
          href="/{novel_id}/{nextChapter}"
          class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
          title="Next Chapter"
        >
          <ChevronRight size={20} />
        </a>
      {/if}
    </div>
  </div>

  <!-- Chapter Content -->
  <article
    style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};"
    class="prose prose-lg dark:prose-invert max-w-none pb-4"
  >
    {#each paragraphs as paragraph, i (i)}
      <p>{paragraph}</p>
    {/each}
  </article>

  {#if !hasNextChapter}
    <div class="flex justify-center pb-3">
      <span>You have caught up!</span>
    </div>
  {/if}

  <!-- Bottom Chapter Navigation -->
  <div class="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
    {#if hasNextChapter}
      <LinkButton class="border border-gray-700" href="/{novel_id}/{nextChapter}">
        Next Chapter
        <ChevronRight size={20} />
      </LinkButton>
    {:else}
      <div></div>
    {/if}

    {#if hasPrevChapter}
      <LinkButton
        href="/{novel_id}/{prevChapter}"
        class="bg-pennBlue-900 w-full border border-gray-700"
      >
        <div class="flex items-center gap-2">
          <ChevronLeft size={20} />
          <span>Previous Chapter</span>
        </div>
      </LinkButton>
    {:else}
      <div></div>
    {/if}
    <Button class="bg-pennBlue-900 w-full border border-gray-700" onclick={() => scrollPage('top')}>
      <span>Go to Top</span>
      <ChevronUp size={20} />
    </Button>
  </div>
</div>

<!-- Hidden form to store progress values -->
<form action="?/progress" class="hidden" method="POST" use:enhance bind:this={progressForm}>
  <input type="text" name="lastChapterNumber" value={last_chapter_number} />
  <input type="text" name="chapterName" value={chapter_name} />
  <input type="text" name="chapterNumber" value={chapter_number} />
</form>
