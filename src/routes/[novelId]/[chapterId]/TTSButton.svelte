<script lang="ts">
  import { getAudioPlayerContext } from '$lib/services/AudioPlayer.svelte'
  import { onDestroy } from 'svelte'

  interface Props {
    text: string
  }

  let { text: _text }: Props = $props()
  const tts = getAudioPlayerContext()

  async function handleClick() {
    // if (!tts) return
    switch (tts.playbackState) {
      case 'playing':
        tts.stop()
        break
      case 'stopped':
        await tts.play()
        break
    }
  }

  onDestroy(() => {
    console.log('destroy')
    tts.destroy()
  })
</script>

<button
  onclick={handleClick}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <!-- {#if tts?.state === 'playing'} -->
  <!--   <Volume2 class="animate-pulse" size={20} /> -->
  <!-- {:else if tts?.state === 'loading'} -->
  <!--   <Loader2 class="animate-spin" size={20} /> -->
  <!-- {:else} -->
  <!--   <Play size={20} /> -->
  <!-- {/if} -->
  <!-- <Play size={20} /> -->
  {tts.playbackState}
</button>
