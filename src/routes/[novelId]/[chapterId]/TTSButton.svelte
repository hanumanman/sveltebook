<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import TextReader from '$lib/services/textReader.svelte'
  import { Play, Volume2, Loader2 } from 'lucide-svelte'
  import { onDestroy, onMount } from 'svelte'

  interface Props {
    text: string
    nextPageUrl: string
  }

  let { text, nextPageUrl }: Props = $props()

  const tts = TextReader.getInstance()

  function gotoNextPage() {
    goto(nextPageUrl)
  }

  function handleClick() {
    switch (tts.getState) {
      case 'paused':
        tts.resume()
        break
      case 'playing':
        tts.pause()
        break
      case 'stopped':
        tts.play(text, gotoNextPage)
        break
      case 'loading':
        // Do nothing while loading
        break
      default:
        break
    }
  }

  let autoplay = $state(browser ? localStorage.getItem('autoplay') === 'true' : false)

  $effect(() => {
    if (!browser) return
    localStorage.setItem('autoplay', autoplay.toString())
  })

  onMount(() => {
    if (!browser) return
    if (autoplay) {
      tts.play(text, gotoNextPage)
    }
  })

  onDestroy(() => {
    tts.stop()
  })
</script>

<label class="flex gap-1 items-center text-xs sm:text-sm">
  <input type="checkbox" bind:checked={autoplay} />
  Autoplay
</label>
<button
  onclick={handleClick}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-2 sm:p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={tts.getState === 'loading'}
>
  {#if tts.getState === 'playing'}
    <Volume2 class="animate-pulse w-[18px] h-[18px] sm:w-5 sm:h-5" />
  {:else if tts.getState === 'loading'}
    <Loader2 class="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5" />
  {:else}
    <Play size={18} class="sm:w-5 sm:h-5" />
  {/if}
</button>
