<script lang="ts">
  import { NativeBackend } from '$lib/services/audio/NativeBackend'
  import { TikTokBackend } from '$lib/services/audio/TikTokBackend'
  import { audioState } from '$lib/services/audio/states.svelte'

  const audio = audioState
  const controller = $derived(
    audio.getCurrentBackend() === 'synthesis' ? new NativeBackend() : new TikTokBackend()
  )

  const testText = 'Hello dog'

  function handleAudioPlay(): void {
    switch (audio.getState()) {
      case 'playing':
        controller.pause()
        break
      case 'paused':
        controller.play(testText)
        break
      case 'stopped':
        controller.play(testText)
    }
  }

  function switchBackend(): void {
    audio.setBackend(audio.getCurrentBackend() === 'synthesis' ? 'tiktok' : 'synthesis')
  }
</script>

<div>{audio.getVoice()}</div>
<div>{audio.getCurrentBackend()}</div>
<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  onclick={handleAudioPlay}>Test button</button
>

<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  onclick={handleAudioPlay}
>
  {audio.getState()}
</button>

<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  onclick={switchBackend}
>
  Switch backend: {audio.getCurrentBackend()}
</button>

<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  onclick={() => controller.play(testText)}
>
  Play
</button>
