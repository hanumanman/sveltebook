<script lang="ts">
  import { TTSAudioPlayer, type TTSData } from '$lib/services/tts.svelte'
  import { onMount } from 'svelte'

  interface Props {
    ttsData: TTSData
  }

  let { ttsData }: Props = $props()

  let tts: TTSAudioPlayer | null = $state(null)

  onMount(async () => {
    try {
      tts = new TTSAudioPlayer(ttsData)
    } catch (error) {
      console.error(error)
      throw new Error('Failed to initialize TTS service')
    }
  })

  function handleClick() {
    if (!tts) return
    switch (tts.state) {
      case 'idle':
      case 'stopped':
        tts.speak()
        break
      case 'speaking':
        tts.pause()
        break
      case 'paused':
        tts.resume()
        break
    }
  }
</script>

{#if tts?.isSupported()}
  <button
    onclick={handleClick}
    class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <!-- {#if tts.state === 'speaking'} -->
    <!--   <Pause size={20} /> -->
    <!-- {:else} -->
    <!--   <Play size={20} /> -->
    <!-- {/if} -->
    {tts.state}
  </button>
{/if}
