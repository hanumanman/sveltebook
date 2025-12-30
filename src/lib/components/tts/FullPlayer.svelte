<script lang="ts">
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
</script>

<div
  class="rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-6"
  style="background-color: {themes[themeName]?.background ||
    themes.default.background}; color: {themes[themeName]?.color || themes.default.color};"
  role="region"
  aria-label="Text to Speech Player"
>
  <div class="flex items-center gap-3">
    <PlayPauseButton {text} {nextPageUrl} />
    <StopButton />
    <SpeedMenu />
    <VoiceSelector />
    <Wave />
  </div>
</div>
