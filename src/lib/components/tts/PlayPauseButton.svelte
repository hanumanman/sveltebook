<script lang="ts">
  import { goto } from '$app/navigation'
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { getLocalStorageItem } from '$lib/utils/localStorage'
  import { Loader2, Pause, Play } from 'lucide-svelte'

  interface Props {
    compact?: boolean
    text: string
    nextPageUrl?: string
  }

  let { compact = false, text, nextPageUrl }: Props = $props()
  const player = $derived(TikTokPlayer.getInstance())

  function handleClick() {
    switch (player.playbackState) {
      case 'playing':
        player.pause()
        break
      case 'paused':
        player.resume()
        break
      case 'stopped': {
        const voice = getLocalStorageItem('tiktokVoice', 'female') as 'male' | 'female'
        player.play(text, voice, nextPageUrl ? () => goto(nextPageUrl) : undefined)
        break
      }
    }
  }
</script>

<button
  onclick={handleClick}
  disabled={player.playbackState === 'loading'}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300
         {compact ? 'p-2' : 'p-2 sm:p-3'}
         dark:border-gray-700
         disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label={player.playbackState === 'playing' ? 'Pause' : 'Play'}
>
  {#if player.playbackState === 'loading'}
    <Loader2 class="animate-spin {compact ? 'w-4 h-4' : 'w-[18px] h-[18px] sm:w-5 sm:h-5'}" />
  {:else if player.playbackState === 'playing'}
    <Pause class={compact ? 'w-4 h-4' : 'w-[18px] h-[18px] sm:w-5 sm:h-5'} />
  {:else}
    <Play size={compact ? 16 : 18} class="sm:w-5 sm:h-5" />
  {/if}
</button>
