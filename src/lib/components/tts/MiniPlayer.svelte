<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { fly } from 'svelte/transition'

  import PlayPauseButton from './PlayPauseButton.svelte'
  import SpeedMenu from './SpeedMenu.svelte'
  import StopButton from './StopButton.svelte'
  import VoiceSelector from './VoiceSelector.svelte'
  import Wave from './Wave.svelte'

  interface Props {
    text: string
    nextPageUrl?: string
    themeName: string
    themes: Record<string, { background: string; color: string }>
  }

  let { text, nextPageUrl, themeName, themes }: Props = $props()
  const _player = TikTokPlayer.getInstance()
</script>

<div
  transition:fly={{ y: 100, duration: 300 }}
  class="fixed bottom-0 right-0 left-0 w-full
         sm:bottom-4 sm:right-4 sm:left-auto sm:w-80
         border border-gray-300 dark:border-gray-700
         p-3 shadow-xl z-40
         sm:rounded-lg rounded-t-lg rounded-b-none"
  style="background-color: {themes[themeName]?.background ||
    themes.default.background}; color: {themes[themeName]?.color || themes.default.color};"
  role="region"
  aria-label="Mini Text to Speech Player"
>
  <div class="flex items-center gap-2 mb-2">
    <PlayPauseButton compact={true} {text} {nextPageUrl} />
    <StopButton compact={true} />
    <SpeedMenu />
    <VoiceSelector compact={true} />
    <Wave />
  </div>
</div>
