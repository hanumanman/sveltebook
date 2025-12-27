<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { TIKTOK_PLAYER_CONSTANTS } from '$lib/services/tiktokPlayer.constants'
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { getLocalStorageItem } from '$lib/utils/localStorage'
  import { Loader2, Pause, Play } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
    nextPageUrl: string
  }

  let { text, nextPageUrl }: Props = $props()

  const tiktokPlayer = TikTokPlayer.getInstance()

  function gotoNextPage() {
    goto(nextPageUrl)
  }

  function getSelectedVoice(): 'male' | 'female' {
    return getLocalStorageItem('tiktokVoice', 'female')
  }

  function isAutoplayEnabled(): boolean {
    return getLocalStorageItem('tiktokAutoplay', false, (v) => v === 'true')
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
        tiktokPlayer.play(text, getSelectedVoice(), isAutoplayEnabled() ? gotoNextPage : undefined)
        break
      case 'loading':
        break
      default:
        break
    }
  }

  onMount(() => {
    if (!browser) return
    if (getLocalStorageItem('tiktokAutoplay', false, (v) => v === 'true')) {
      tiktokPlayer.play(text, getSelectedVoice(), gotoNextPage)
    }
  })

  onDestroy(() => {
    tiktokPlayer.stop()
  })

  const circumference = 2 * Math.PI * TIKTOK_PLAYER_CONSTANTS.CIRCLE_RADIUS
  const progressOffset = $derived(circumference - (tiktokPlayer.getProgress / 100) * circumference)
</script>

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
        r={TIKTOK_PLAYER_CONSTANTS.CIRCLE_RADIUS}
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
        r={TIKTOK_PLAYER_CONSTANTS.CIRCLE_RADIUS}
        cx="22"
        cy="22"
      />
    </svg>
  {/if}

  <button
    onclick={handleClick}
    class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={tiktokPlayer.getState === 'loading'}
    title="TikTok TTS"
  >
    {#if tiktokPlayer.getState === 'playing'}
      <Pause class="animate-pulse w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else if tiktokPlayer.getState === 'loading'}
      <Loader2 class="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else}
      <Play size={18} class="sm:w-5 sm:h-5" />
    {/if}
  </button>
</div>
