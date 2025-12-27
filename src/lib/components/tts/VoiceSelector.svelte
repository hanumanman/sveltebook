<script lang="ts">
  import { getLocalStorageItem, setLocalStorageItem } from '$lib/utils/localStorage'
  import { ChevronDown } from 'lucide-svelte'
  import { fly } from 'svelte/transition'

  const voices = [
    { id: 'female', name: 'Female' },
    { id: 'male', name: 'Male' }
  ] as const

  interface Props {
    compact?: boolean
  }

  let { compact = false }: Props = $props()

  let isOpen = $state(false)
  let selectedVoice = $state(getLocalStorageItem('tiktokVoice', 'female'))

  function toggleMenu() {
    isOpen = !isOpen
  }

  function setVoice(voiceId: 'male' | 'female') {
    selectedVoice = voiceId
    setLocalStorageItem('tiktokVoice', voiceId)
    isOpen = false
  }

  function handleClickOutside(event: MouseEvent) {
    if (!(event.target as Element).closest('.voice-selector-container')) {
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

<div class="voice-selector-container relative inline-block">
  <button
    onclick={toggleMenu}
    class="flex items-center gap-1 hover:bg-pennBlue-600 cursor-pointer
           rounded-lg border border-gray-300
           {compact ? 'p-2 text-xs' : 'p-2 sm:p-3 text-sm'}
           dark:border-gray-700"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-label={`Voice: ${voices.find((v) => v.id === selectedVoice)?.name}`}
  >
    <span class="font-medium">{voices.find((v) => v.id === selectedVoice)?.name}</span>
    <ChevronDown size={compact ? 14 : 16} class="w-4 h-4" />
  </button>

  {#if isOpen}
    <div
      transition:fly={{ y: -10, duration: 200 }}
      class="absolute top-full right-0 mt-2 bg-pennBlue-900 border border-gray-700
             rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]"
      role="menu"
      aria-label="Voice options"
    >
      {#each voices as voice (voice.id)}
        <button
          onclick={() => setVoice(voice.id)}
          class="w-full text-left px-4 py-2
                 hover:bg-pennBlue-700 transition-colors
                 {compact ? 'text-xs' : 'text-sm'}
                 text-gray-300
                 {selectedVoice === voice.id ? 'bg-pennBlue-700 text-white' : ''}"
          role="menuitem"
          aria-current={selectedVoice === voice.id ? 'true' : undefined}
        >
          {voice.name}
        </button>
      {/each}
    </div>
  {/if}
</div>
