<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
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
    switch (tiktokPlayer.playbackState) {
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
</script>

<div class="relative inline-flex items-center justify-center">
  <button
    onclick={handleClick}
    class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={tiktokPlayer.playbackState === 'loading'}
    title="TikTok TTS"
  >
    {#if tiktokPlayer.playbackState === 'playing'}
      <Pause class="animate-pulse w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else if tiktokPlayer.playbackState === 'loading'}
      <Loader2 class="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5" />
    {:else}
      <Play size={18} class="sm:w-5 sm:h-5" />
    {/if}
  </button>
</div>
