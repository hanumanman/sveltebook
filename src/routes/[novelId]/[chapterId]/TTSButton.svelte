<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import TextReader from '$lib/services/textReader.svelte'
  import { Play, Volume2, Loader2 } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
    nextPageUrl: string
    title?: string
    chapterTitle?: string
  }

  let { text, nextPageUrl, title = 'Novel', chapterTitle = 'Chapter' }: Props = $props()

  const tts = TextReader.getInstance()

  function gotoNextPage() {
    goto(nextPageUrl)
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
        tts.play(text, gotoNextPage, { title, artist: chapterTitle })
        break
      case 'loading':
        // Do nothing while loading
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
      tts.play(text, gotoNextPage, { title, artist: chapterTitle })
    }
  })

  onDestroy(() => {
    tts.stop()
  })

  // Calculate progress circle
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progressOffset = $derived(circumference - (tts.getProgress / 100) * circumference)
</script>

<label class="flex gap-1 items-center text-xs sm:text-sm">
  <input type="checkbox" bind:checked={autoplay} />
  Autoplay
</label>
<div class="relative inline-flex items-center justify-center">
  <!-- Progress Ring -->
  {#if tts.getState === 'playing' || tts.getState === 'paused' || tts.getState === 'loading'}
    <svg class="absolute -top-1 -left-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]" viewBox="0 0 44 44">
      <circle
        class="text-gray-200 dark:text-gray-700"
        stroke-width="3"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="22"
        cy="22"
      />
      <circle
        class="text-pennBlue-600 dark:text-pennBlue-400 transition-all duration-300 ease-linear"
        stroke-width="3"
        stroke-dasharray={circumference}
        stroke-dashoffset={progressOffset}
        stroke-linecap="round"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="22"
        cy="22"
      />
    </svg>
  {/if}

  <button
    onclick={handleClick}
    class="hover:bg-pennBlue-600 cursor-pointer rounded-full border border-gray-300 p-2 sm:p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed z-10 bg-white dark:bg-gray-900"
    disabled={tts.getState === 'loading'}
  >
    {#if tts.getState === 'playing'}
      <Volume2 class="animate-pulse w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else if tts.getState === 'loading'}
      <Loader2 class="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else}
      <Play size={18} class="sm:w-5 sm:h-5" />
    {/if}
  </button>
</div>
