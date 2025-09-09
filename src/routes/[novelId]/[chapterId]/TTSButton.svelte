<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import TextReader from '$lib/services/textReader.svelte'
  import { Play, Volume2 } from 'lucide-svelte'
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

<label class="flex gap-1 items-center">
  <input type="checkbox" bind:checked={autoplay} />
  Autoplay
</label>
<button
  onclick={handleClick}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if tts.getState === 'playing'}
    <Volume2 class="animate-pulse" size={20} />
  {:else}
    <Play size={20} />
  {/if}
</button>
