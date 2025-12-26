<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { Loader2, Play, Volume2 } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
    nextPageUrl: string
  }

  let { text, nextPageUrl }: Props = $props()

  const tiktokPlayer = TikTokPlayer.getInstance()

  let selectedVoice: 'male' | 'female' = $state(
    browser ? (localStorage.getItem('tiktokVoice') as 'male' | 'female') || 'female' : 'female'
  )

  function gotoNextPage() {
    goto(nextPageUrl)
  }

  function handleClick() {
    switch (tiktokPlayer.getState) {
      case 'paused':
        tiktokPlayer.resume()
        break
      case 'playing':
        tiktokPlayer.pause()
        break
      case 'stopped':
        tiktokPlayer.play(text, selectedVoice, gotoNextPage)
        break
      case 'loading':
        break
      default:
        break
    }
  }

  let autoplay = $state(browser ? localStorage.getItem('tiktokAutoplay') === 'true' : false)

  $effect(() => {
    if (!browser) return
    localStorage.setItem('tiktokAutoplay', autoplay.toString())
  })

  $effect(() => {
    if (!browser) return
    localStorage.setItem('tiktokVoice', selectedVoice)
  })

  onMount(() => {
    if (!browser) return
    if (autoplay) {
      tiktokPlayer.play(text, selectedVoice, gotoNextPage)
    }
  })

  onDestroy(() => {
    tiktokPlayer.stop()
  })

  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progressOffset = $derived(circumference - (tiktokPlayer.getProgress / 100) * circumference)
</script>

<div class="flex items-center gap-2">
  <label class="flex gap-1 items-center text-xs sm:text-sm">
    <input type="checkbox" bind:checked={autoplay} />
    Autoplay
  </label>

  <select
    bind:value={selectedVoice}
    class="text-xs sm:text-sm rounded border border-gray-300 bg-white px-1 py-0.5 dark:border-gray-700 dark:bg-gray-900"
  >
    <option value="female">Female</option>
    <option value="male">Male</option>
  </select>

  <div class="relative inline-flex items-center justify-center">
    {#if tiktokPlayer.getState === 'playing' || tiktokPlayer.getState === 'paused' || tiktokPlayer.getState === 'loading'}
      <svg
        class="absolute -top-1 -left-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]"
        viewBox="0 0 44 44"
      >
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
      disabled={tiktokPlayer.getState === 'loading'}
      title="TikTok TTS"
    >
      {#if tiktokPlayer.getState === 'playing'}
        <Volume2 class="animate-pulse w-[18px] h-[18px] sm:w-5 sm:h-5" />
      {:else if tiktokPlayer.getState === 'loading'}
        <Loader2 class="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5" />
      {:else}
        <Play size={18} class="sm:w-5 sm:h-5" />
      {/if}
    </button>
  </div>
</div>
