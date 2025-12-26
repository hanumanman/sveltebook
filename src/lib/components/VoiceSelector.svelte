<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'

  const voices = [
    { id: 'female', name: 'Female', gender: 'female' },
    { id: 'male', name: 'Male', gender: 'male' }
  ] as const

  let selectedVoice = $state(
    browser ? (localStorage.getItem('tiktokVoice') as 'male' | 'female') || 'female' : 'female'
  )

  onMount(() => {
    if (browser) {
      selectedVoice = (localStorage.getItem('tiktokVoice') as 'male' | 'female') || 'female'
    }
  })

  function handleVoiceChange(voiceId: 'male' | 'female') {
    selectedVoice = voiceId
    if (browser) {
      localStorage.setItem('tiktokVoice', voiceId)
    }
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-sm font-medium">Select Voice:</span>
  {#each voices as voice (voice.id)}
    <label
      class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
    >
      <input
        type="radio"
        name="voice"
        value={voice.id}
        checked={selectedVoice === voice.id}
        onchange={() => handleVoiceChange(voice.id)}
        class="w-4 h-4"
      />
      <span class="text-sm">{voice.name}</span>
    </label>
  {/each}
</div>
