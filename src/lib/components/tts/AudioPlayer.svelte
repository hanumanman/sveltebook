<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { getLocalStorageItem } from '$lib/utils/localStorage'

  import FullPlayer from './FullPlayer.svelte'
  import MiniPlayer from './MiniPlayer.svelte'

  interface Props {
    text: string
    nextPageUrl?: string
    themeName: string
    themes: Record<string, { background: string; color: string }>
  }

  let { text, nextPageUrl, themeName, themes }: Props = $props()
  const player = TikTokPlayer.getInstance()

  let isInViewport = $state(true)
  let hasMounted = false

  const shouldShowMiniPlayer = $derived(
    !isInViewport && (player.playbackState === 'playing' || player.playbackState === 'paused')
  )

  function observeIntersection(node: HTMLElement) {
    if (!browser) return {}

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isInViewport = entry.isIntersecting
      },
      {
        root: null,
        rootMargin: '-50px 0px -50px 0px',
        threshold: 0
      }
    )

    observer.observe(node)

    return {
      destroy() {
        observer.disconnect()
      }
    }
  }

  $effect(() => {
    if (!browser) return

    function handleKeyPress(event: KeyboardEvent) {
      if (event.code === 'Space') {
        const target = event.target as HTMLElement
        const isTyping =
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

        if (!isTyping) {
          event.preventDefault()

          switch (player.playbackState) {
            case 'playing':
              player.pause()
              break
            case 'paused':
              player.resume()
              break
            case 'stopped': {
              const voice = getLocalStorageItem('tiktokVoice', 'female') as 'male' | 'female'
              player.play(text, voice, nextPageUrl ? () => goto(nextPageUrl) : undefined)
              break
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  })

  $effect(() => {
    if (!browser || hasMounted) return

    hasMounted = true
    if (getLocalStorageItem('tiktokAutoplay', false, (v) => v === 'true')) {
      const voice = getLocalStorageItem('tiktokVoice', 'female') as 'male' | 'female'
      player.play(text, voice, nextPageUrl ? () => goto(nextPageUrl) : undefined)
    }
  })
</script>

<div use:observeIntersection class="audio-player-full">
  <FullPlayer {text} {nextPageUrl} {themeName} {themes} />
</div>

{#if shouldShowMiniPlayer}
  <MiniPlayer {text} {nextPageUrl} {themeName} {themes} />
{/if}
