<script lang="ts">
  import { AudioPlayer } from '$lib/services/tts/AudioPlayer.svelte'
  // import { Loader2, Play, Volume2 } from 'lucide-svelte'
  import { onMount } from 'svelte'

  interface Props {
    text: string
  }

  let { text }: Props = $props()

  let tts: AudioPlayer | null = $state(null)

  onMount(async () => {
    tts = AudioPlayer.getInstance()
  })

  async function handleClick() {
    if (!tts) throw new Error('TTS is not initialized')

    await tts.resumeContext()
    // tts.playAudio(text)
    tts.playAudioImmediate(text)
    // switch (tts.getState()) {
    //   case 'loading':
    //     break
    //   case 'running':
    //     // tts.pause()
    //     break
    //   case 'closed':
    //     await tts.playAudio(text)
    //     break
    // }
  }
</script>

<button
  onclick={handleClick}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {tts?.getState()}
</button>

<!-- <button -->
<!--   onclick={handleClick} -->
<!--   class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" -->
<!-- > -->
<!--   {#if tts?.getState() === 'running'} -->
<!--     <Volume2 class="animate-pulse" size={20} /> -->
<!--   {:else if tts?.getState() === 'loading'} -->
<!--     <Loader2 class="animate-spin" size={20} /> -->
<!--   {:else} -->
<!--     <Play size={20} /> -->
<!--   {/if} -->
<!-- </button> -->
