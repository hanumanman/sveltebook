<script lang="ts">
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'

  const voices = [
    { id: 'vi-VN-HoaiMyNeural', name: 'HoaiMy (Female)', gender: 'female' },
    { id: 'vi-VN-NamMinhNeural', name: 'NamMinh (Male)', gender: 'male' }
  ]

  let selectedVoice = $state('vi-VN-NamMinhNeural')

  onMount(() => {
    if (browser) {
      selectedVoice = localStorage.getItem('selectedVoice') || 'vi-VN-NamMinhNeural'
    }
  })

  function handleVoiceChange(voiceId: string) {
    selectedVoice = voiceId
    if (browser) {
      localStorage.setItem('selectedVoice', voiceId)
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
