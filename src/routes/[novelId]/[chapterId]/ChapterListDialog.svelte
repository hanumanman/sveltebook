<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '$lib/components/Button.svelte'
  import { X } from 'lucide-svelte'

  interface Props {
    open: boolean
    toggleDialogFn: () => void
    novelId: number
    currentChapterNumber: number
  }

  let { open, toggleDialogFn, novelId, currentChapterNumber }: Props = $props()

  let searchQuery = $state('')
  let chapters: { id: number; chapter_name: string; chapter_number: number }[] = $state([])
  let loading = $state(false)
  let error = $state('')

  async function fetchChapters() {
    loading = true
    error = ''
    try {
      const res = await fetch(`/api/novel/${novelId}/chapters`)
      if (!res.ok) throw new Error('Failed to load chapters')
      chapters = await res.json()
    } catch (e) {
      error = 'Could not load chapters'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (open && chapters.length === 0 && !loading) {
      fetchChapters()
    }
  })

  const filteredChapters = $derived(
    chapters.filter((chapter) =>
      chapter.chapter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.chapter_number.toString().includes(searchQuery)
    )
  )
  
  function handleBackdropClick(e: MouseEvent) {
    // Close dialog if clicking the backdrop (not the content)
    if (e.target === e.currentTarget) {
      toggleDialogFn()
    }
  }
</script>

{#if open}
  <div 
    class="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <div class="flex h-[90vh] sm:h-[80vh] w-full max-w-lg flex-col rounded-lg bg-gray-900 border border-gray-700 shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-700 p-3 sm:p-4">
        <h2 class="text-lg sm:text-xl font-bold text-gray-100">Table of Contents</h2>
        <button onclick={toggleDialogFn} class="text-gray-400 hover:text-white p-1">
          <X size={20} class="sm:w-6 sm:h-6" />
        </button>
      </div>

      <!-- Search -->
      <div class="p-3 sm:p-4">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search chapters..."
          class="w-full rounded-md border border-gray-700 bg-gray-800 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-3 sm:p-4 pt-0">
        {#if loading}
          <div class="flex h-full items-center justify-center text-gray-400 text-sm sm:text-base">
            Loading chapters...
          </div>
        {:else if error}
          <div class="flex h-full items-center justify-center text-red-400 text-sm sm:text-base">
            {error}
          </div>
        {:else}
          <div class="flex flex-col gap-1.5 sm:gap-2">
            {#each filteredChapters as chapter (chapter.id)}
              <a
                href={`/${novelId}/${chapter.chapter_number}`}
                class="flex items-center rounded-md px-3 sm:px-4 py-2.5 sm:py-3 transition-colors hover:bg-gray-800 {chapter.chapter_number === currentChapterNumber ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'text-gray-300'}"
                onclick={toggleDialogFn}
              >
                <span class="mr-2 sm:mr-3 w-6 sm:w-8 text-right text-xs sm:text-sm font-mono text-gray-500">{chapter.chapter_number}</span>
                <span class="truncate font-medium text-sm sm:text-base">{chapter.chapter_name}</span>
              </a>
            {/each}
            {#if filteredChapters.length === 0}
              <div class="py-8 text-center text-gray-500 text-sm sm:text-base">
                No chapters found
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
