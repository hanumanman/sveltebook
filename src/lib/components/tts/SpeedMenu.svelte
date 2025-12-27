<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { getLocalStorageItem, setLocalStorageItem } from '$lib/utils/localStorage'
  import { ChevronDown } from 'lucide-svelte'
  import { fly } from 'svelte/transition'

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const
  const player = TikTokPlayer.getInstance()

  let isOpen = $state(false)
  let currentSpeed = $state(getLocalStorageItem('tiktokPlaybackRate', 1.0, parseFloat))

  function toggleMenu() {
    isOpen = !isOpen
  }

  function setSpeed(speed: number) {
    currentSpeed = speed
    player.setPlaybackRate(speed)
    setLocalStorageItem('tiktokPlaybackRate', speed, String)
    isOpen = false
  }

  function handleClickOutside(event: MouseEvent) {
    if (!(event.target as Element).closest('.speed-menu-container')) {
      isOpen = false
    }
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  })
</script>

<div class="speed-menu-container relative inline-block">
  <button
    onclick={toggleMenu}
    class="flex items-center gap-1 hover:bg-pennBlue-600 cursor-pointer
           rounded-lg border border-gray-300 p-2 sm:p-3
           dark:border-gray-700"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-label={`Playback speed: ${currentSpeed}x`}
  >
    <span class="text-sm font-medium">{currentSpeed}x</span>
    <ChevronDown size={16} class="w-4 h-4" />
  </button>

  {#if isOpen}
    <div
      transition:fly={{ y: -10, duration: 200 }}
      class="absolute top-full right-0 mt-2 bg-pennBlue-900 border border-gray-700
             rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]"
      role="menu"
      aria-label="Playback speed options"
    >
      {#each speeds as speed (speed)}
        <button
          onclick={() => setSpeed(speed)}
          class="w-full text-left px-4 py-2 text-sm text-gray-300
                 hover:bg-pennBlue-700 transition-colors
                 {currentSpeed === speed ? 'bg-pennBlue-700 text-white' : ''}"
          role="menuitem"
          aria-current={currentSpeed === speed ? 'true' : undefined}
        >
          {speed}x
        </button>
      {/each}
    </div>
  {/if}
</div>
