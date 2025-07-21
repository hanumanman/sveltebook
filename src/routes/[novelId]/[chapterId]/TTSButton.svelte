<script lang="ts">
  import { TTSService } from '$lib/services/tts.svelte'
  import { Pause, Play } from 'lucide-svelte'

  const tts = new TTSService()

  function handleClick() {
    switch (tts.state) {
      case 'idle':
        tts.speak('Hello, world!')
        break
      case 'speaking':
        tts.pause()
        break
      case 'paused':
        tts.resume()
        break
      case 'stopped':
        tts.speak('Hello, world!')
        break
    }
  }
</script>

{#if tts.isSupported()}
  <p>{tts.state}</p>
  <button
    onclick={handleClick}
    class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
    title="Open Settings Dialog"
  >
    {#if tts.state === 'speaking'}
      <Pause size={20} />
    {:else}
      <Play size={20} />
    {/if}
  </button>
{/if}
