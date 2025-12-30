<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'

  const player = $derived(TikTokPlayer.getInstance())
  const playbackStatus = $derived(player.playbackState)

  let containerWidth = $state(0)
  let animationStarted = $state(false)

  const barWidth = 4
  const barGap = 2

  const barCount = $derived(
    containerWidth > 0 ? Math.floor((containerWidth + barGap) / (barWidth + barGap)) : 5
  )

  $effect(() => {
    if (playbackStatus === 'playing' && !animationStarted) {
      animationStarted = true
    }
  })
</script>

<div
  bind:clientWidth={containerWidth}
  class="flex grow px-2 pb-0 overflow-hidden items-end justify-center gap-0.5 h-6"
  role="status"
  aria-label="Audio playback: {playbackStatus}"
>
  {#each { length: barCount } as _, i (i)}
    <div
      class="w-1 rounded-full bg-burgundy-500 transition-all duration-75"
      class:playing={animationStarted}
      class:paused={playbackStatus === 'paused' && animationStarted}
      class:loading={playbackStatus === 'loading'}
      style="--delay: {i * 0.1}s; height: {Math.min(
        100,
        Math.max(25, 25 + Math.sin(i * 1.5) * 100)
      )}%;"
    ></div>
  {/each}
</div>

<style>
  @keyframes wave {
    0%,
    100% {
      transform: scaleY(0.3);
    }
    50% {
      transform: scaleY(1);
    }
  }

  .playing {
    animation: wave 0.5s ease-in-out infinite;
    animation-delay: var(--delay);
    transform-origin: bottom;
  }

  .paused {
    animation-play-state: paused;
  }

  .loading {
    animation: wave 0.4s ease-in-out infinite alternate;
    animation-delay: var(--delay);
    opacity: 0.4;
  }
</style>
