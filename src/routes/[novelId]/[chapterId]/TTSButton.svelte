<script lang="ts">
  import { TTSPlayer } from '$lib/services/ttsPlayer.svelte'
  import { Loader2, Play, Volume2 } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
  }

  let { text }: Props = $props()

  let tts: TTSPlayer | null = $state(null)

  onMount(async () => {
    tts = new TTSPlayer()
  })

  async function handleClick() {
    if (!tts) return
    switch (tts.state) {
      case 'loading':
        break
      case 'playing':
        tts.pause()
        break
      case 'stopped':
        await tts.stream(text)
        break
      case 'paused':
        tts.resume()
        break
    }
  }

  onDestroy(() => {
    if (tts) {
      tts.destroy()
    }
  })
</script>

<button
  onclick={handleClick}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if tts?.state === 'playing'}
    <Volume2 class="animate-pulse" size={20} />
  {:else if tts?.state === 'loading'}
    <Loader2 class="animate-spin" size={20} />
  {:else}
    <Play size={20} />
  {/if}
</button>
