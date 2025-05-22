<script lang="ts">
  import { preloadData, pushState } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import LoadingPage from '$lib/components/LoadingPage.svelte';
  import { scrollPage } from '$lib/utils';
  import { ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, Settings } from 'lucide-svelte';
  import { tick } from 'svelte';
  import { innerHeight, scrollY } from 'svelte/reactivity/window';

  import PageSettingsDialog from '../../../[novelId]/[chapterId]/PageSettingsDialog.svelte';
  import { pageSettingsStore, themes } from '../../../[novelId]/[chapterId]/pageSettingsStore';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const { chapter } = $derived(data);

  const { paragraphs, chapter_name, chapter_number, novel_id } = $derived(data.chapter);
  const totalChapters = $derived(data.chapter_count);

  function saveProgress(lastChapterName: string, chapterNumber: number) {
    const formData = new FormData();
    formData.append('lastChapterName', lastChapterName);
    formData.append('chapterNumber', chapterNumber.toString());
    const url = `/${novel_id}/${chapterNumber}`;
    fetch(url, { method: 'POST', body: formData });
  }

  let openSettingsDialog = $state(false);
  function toggleSettingsDialog() {
    openSettingsDialog = !openSettingsDialog;
  }

  // svelte-ignore state_referenced_locally
  let currentChapter = $state(chapter.chapter_number);

  // svelte-ignore state_referenced_locally
  let contents = $state([chapter]);

  let isLoading = $state(false);

  async function loadNextChapter() {
    await tick();
    isLoading = true;
    currentChapter++;

    const nextChapterHref = `/infinite/${chapter.novel_id}/${currentChapter}`;

    pushState(nextChapterHref, {
      chapter: currentChapter
    });

    const result = await preloadData(nextChapterHref);
    if (result.type === 'loaded') {
      contents.push(result.data.chapter);
      saveProgress(result.data.chapter.chapter_name, currentChapter);
    }
    isLoading = false;
    return;
  }

  let scrollableHeight = $state(0);

  $effect(() => {
    scrollableHeight = document.body.scrollHeight - innerHeight.current!;
    if (scrollableHeight - 20 < scrollY.current!) {
      loadNextChapter();
    }
  });
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

  {#each contents as chapter, index}
    <!-- Chapter Title -->
    <div class="mb-6 gap-4 border-b border-gray-500 pb-6">
      <div>
        <h1 class="pb-3 text-xl text-gray-600 dark:text-gray-400">
          Chapter {chapter.chapter_number}
        </h1>
        <h2 class="mb-1 text-3xl font-bold">{chapter.chapter_name}</h2>
      </div>

      <!-- Page Controls -->
      <div class="flex justify-end gap-2 pt-3">
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

        {#if chapter.chapter_number > 1}
          <a
            href="/{novel_id}/{chapter.chapter_number - 1}"
            class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
            title="Previous Chapter"
          >
            <ChevronLeft size={20} />
          </a>
        {/if}

        {#if chapter.chapter_number < totalChapters}
          <a
            href="/{novel_id}/{chapter.chapter_number + 1}"
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

    {#if chapter.chapter_number === totalChapters}
      <div class="flex justify-center pb-3">
        <span>You have caught up!</span>
      </div>
    {/if}

    {#if isLoading}
      <div class="w-full grid place-items-center my-4">
        <div class="animate-spin">
          <LoaderCircle size={24} />
        </div>
      </div>
    {/if}
  {/each}
</div>
