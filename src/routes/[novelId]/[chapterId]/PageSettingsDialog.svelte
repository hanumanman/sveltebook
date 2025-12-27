<script lang="ts">
  import { browser } from '$app/environment'
  import Button from '$lib/components/Button.svelte'
  import VoiceSelector from '$lib/components/VoiceSelector.svelte'
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { getLocalStorageItem, setLocalStorageItem } from '$lib/utils/localStorage'
  import { fade, fly } from 'svelte/transition'

  import { pageSettingsStore, themes } from './pageSettingsStore'

  interface Props {
    open: boolean
    toggleDialogFn: () => void
  }

  let { open, toggleDialogFn }: Props = $props()

  const tts = TikTokPlayer.getInstance()

  // Playback speed state
  let playbackSpeed = $state(1.0)

  // Load playback speed from localStorage
  $effect(() => {
    if (!browser) return
    const savedSpeed = getLocalStorageItem('tiktokPlaybackRate', 1, parseFloat)
    playbackSpeed = savedSpeed
  })

  // Apply playback speed changes
  $effect(() => {
    if (!browser) return
    tts.setPlaybackRate(playbackSpeed)
  })

  //Convert themes to an array
  const themesArray = Object.entries(themes).map(([key, value]) => ({
    key,
    value
  }))

  // Prevent body scroll when dialog is open
  $effect(() => {
    if (browser && open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  })
</script>

{#if open}
  <!-- Backdrop -->
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
    onclick={toggleDialogFn}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleDialogFn()
      }
    }}
    role="button"
    tabindex="0"
  ></div>

  <!-- Dialog content - bottom sheet on mobile, centered on desktop -->
  <div
    transition:fly={{ y: 500, duration: 300 }}
    class="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
           bg-pennBlue-900 rounded-t-2xl md:rounded-2xl border-2 border-gray-400
           max-h-[85vh] md:max-h-[90vh] overflow-y-auto z-50
           w-full md:max-w-xl"
  >
    <!-- Mobile drag handle -->
    <div class="md:hidden flex justify-center pt-3 pb-2">
      <div class="w-12 h-1 bg-gray-500 rounded-full"></div>
    </div>

    <div class="flex flex-col gap-4 p-4 md:p-6 text-gray-300">
      <h1 class="text-xl md:text-2xl font-bold mb-2">Reading Settings</h1>

      <div class="w-full">
        <h2 class="text-base md:text-lg mb-2">Font size</h2>
        <div class="flex gap-3 items-center">
          <input
            type="range"
            class="grow h-2 cursor-pointer"
            bind:value={$pageSettingsStore.fontSize}
            min="12"
            max="24"
            step="0.1"
          />
          <p class="min-w-[60px] text-right">{$pageSettingsStore.fontSize.toFixed(1)} px</p>
        </div>
      </div>

      <div class="w-full">
        <h2 class="text-base md:text-lg mb-2">Line height</h2>
        <div class="flex gap-3 items-center">
          <input
            type="range"
            class="grow h-2 cursor-pointer"
            bind:value={$pageSettingsStore.lineHeight}
            min="1.0"
            max="3.0"
            step="0.1"
          />
          <p class="min-w-[60px] text-right">{$pageSettingsStore.lineHeight.toFixed(1)}</p>
        </div>
      </div>

      <div class="w-full">
        <h2 class="text-base md:text-lg mb-2">Theme</h2>
        <div class="grid grid-cols-5 md:grid-cols-6 gap-2">
          {#each themesArray as { key, value }, i (i)}
            <button
              class="aspect-square rounded-lg border-2 transition-all text-2xl font-bold
                     {$pageSettingsStore.theme === key
                ? 'border-white scale-105'
                : 'border-transparent'}"
              style="color:{value.color}; background-color:{value.background};"
              onclick={() => {
                $pageSettingsStore.theme = key as keyof typeof themes
              }}
            >
              A
            </button>
          {/each}
        </div>
      </div>

      <div class="w-full border-t border-gray-600 pt-4">
        <h2 class="text-base md:text-lg mb-2">Infinite Reading Mode</h2>
        <p class="text-sm text-gray-400 mb-3">
          Automatically load next chapter when scrolling to bottom
        </p>
        <label
          class="flex items-center gap-3 cursor-pointer p-3 bg-pennBlue-800/50 rounded-lg hover:bg-pennBlue-800"
        >
          <input
            type="checkbox"
            bind:checked={$pageSettingsStore.infiniteReading}
            class="w-6 h-6 rounded border-gray-300 cursor-pointer accent-blue-500"
          />
          <span class="text-base">Enable infinite reading</span>
        </label>
      </div>

      <div class="w-full border-t border-gray-600 pt-4">
        <h2 class="text-base md:text-lg mb-3">TTS Voice</h2>
        <VoiceSelector />
      </div>

      <div class="w-full border-t border-gray-600 pt-4">
        <h2 class="text-base md:text-lg mb-3">Autoplay</h2>
        <p class="text-sm text-gray-400 mb-3">Automatically start TTS when opening a new chapter</p>
        <label
          class="flex items-center gap-3 cursor-pointer p-3 bg-pennBlue-800/50 rounded-lg hover:bg-pennBlue-800"
        >
          <input
            type="checkbox"
            checked={getLocalStorageItem('tiktokAutoplay', false, (v) => v === 'true')}
            onchange={(e) => {
              setLocalStorageItem('tiktokAutoplay', e.currentTarget.checked, String)
            }}
            class="w-6 h-6 rounded border-gray-300 cursor-pointer accent-blue-500"
          />
          <span class="text-base">Enable autoplay</span>
        </label>
      </div>

      <div class="w-full">
        <h2 class="text-base md:text-lg mb-2">Playback Speed</h2>
        <div class="flex gap-3 items-center">
          <input
            type="range"
            class="grow h-2 cursor-pointer"
            bind:value={playbackSpeed}
            min="0.5"
            max="2.0"
            step="0.1"
          />
          <p class="min-w-[60px] text-right">{playbackSpeed.toFixed(1)}x</p>
        </div>
      </div>

      <div
        style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};background-color: {themes[
          $pageSettingsStore.theme
        ].background}; color: {themes[$pageSettingsStore.theme].color};"
        class="p-4 rounded-lg border border-gray-600"
      >
        <p class="line-clamp-3">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam, consectetur sunt, aliquam
          corrupti cupiditate doloremque, ipsum suscipit adipisci maxime itaque beatae quae delectus
          inventore nihil.
        </p>
      </div>

      <div class="flex gap-3 pt-2 sticky bottom-0 bg-pennBlue-900 pb-2 -mb-2">
        <Button class="flex-1 py-3 text-base" onclick={toggleDialogFn}>Close</Button>
        <Button
          class="flex-1 py-3 text-base"
          onclick={() => {
            $pageSettingsStore = {
              fontSize: 16,
              lineHeight: 1.5,
              theme: 'default',
              infiniteReading: false
            }
          }}>Reset</Button
        >
      </div>
    </div>
  </div>
{/if}
