<script lang="ts">
  import { AudioPlayer, type PlaybackState } from '$lib/services/AudioPlayer.svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
  }

  let { text }: Props = $props()
  const tts = AudioPlayer.getInstance()
  let playbackState: PlaybackState = $state('uninit')

  async function handleClick() {
    if (!tts) return
    switch (tts.playbackState) {
      case 'loading':
        break
      case 'stopped':
        tts.resumeContext()
        console.log('play')
        await tts.play(text.split('.')[0])
        break
      case 'playing':
        tts.stop()
        break
    }
  }

  onDestroy(() => {
    if (tts) tts.destroy()
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
  {playbackState}
</button>
