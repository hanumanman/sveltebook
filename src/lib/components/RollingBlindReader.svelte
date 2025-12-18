<script lang="ts">
  import { onMount } from 'svelte'

  export let text: string = ''
  export let isPlaying: boolean = false
  export let speed: number = 20 // % per second
  export let startRatio: number = 0 // 0 to 1, position to start from

  // New props for customization
  export let fontSize: number = 16
  export let lineHeight: number = 1.6
  export let theme: { background: string; color: string } = { background: 'white', color: 'black' }

  let container: HTMLDivElement
  let pages: string[] = []
  let currentIndex: number = 0
  let progress: number = 0 // 0 to 100
  let lastTime: number = 0
  let animationFrameId: number

  // Pagination logic
  async function paginate() {
    if (!container || !text) return

    // Reset
    pages = []
    currentIndex = 0
    progress = 0

    // Create a temporary measurement div
    const measureDiv = document.createElement('div')
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    // Match .layer styles exactly
    measureDiv.style.width = `${container.clientWidth}px`
    measureDiv.style.height = `${container.clientHeight}px` // Enforce height constraint for measurement
    measureDiv.style.padding = '0' // Match .layer padding
    measureDiv.style.boxSizing = 'border-box' // Match .layer box-sizing

    // Apply dynamic styles
    measureDiv.style.fontSize = `${fontSize}px`
    measureDiv.style.lineHeight = `${lineHeight}`
    measureDiv.style.fontFamily = getComputedStyle(container).fontFamily
    measureDiv.style.whiteSpace = 'pre-wrap'

    document.body.appendChild(measureDiv)

    const words = text.split(/(\s+)/) // Split by whitespace but keep delimiters
    let currentPage = ''

    // Track character count to find start page
    let charCount = 0
    const totalChars = text.length
    const targetCharIndex = startRatio * totalChars
    let startPageIndex = 0
    let currentCharsInPage = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testPage = currentPage + word
      measureDiv.textContent = testPage

      // Check if we have overflowed the container height
      if (measureDiv.scrollHeight > measureDiv.clientHeight && currentPage.length > 0) {
        pages.push(currentPage)

        // Check if this page contains our target start index
        if (
          charCount + currentCharsInPage < targetCharIndex &&
          charCount + currentCharsInPage + currentPage.length >= targetCharIndex
        ) {
          // This logic is approximate because we are iterating words.
          // Better: if charCount passed target, we are past it.
        }
        // Actually, simpler: just track total chars pushed so far.
        if (charCount <= targetCharIndex) {
          startPageIndex = pages.length - 1
        }

        charCount += currentPage.length
        currentPage = word
        currentCharsInPage = word.length

        // Re-measure with just the new word
        measureDiv.textContent = currentPage
      } else {
        currentPage = testPage
        currentCharsInPage = testPage.length // Approximate
      }
    }
    if (currentPage) {
      pages.push(currentPage)
      if (charCount <= targetCharIndex) {
        startPageIndex = pages.length - 1
      }
    }

    document.body.removeChild(measureDiv)
    pages = pages // Trigger reactivity

    // Jump to start page
    if (startRatio > 0 && startPageIndex > 0) {
      currentIndex = startPageIndex
    }
  }

  // Animation Loop
  function animate(time: number) {
    if (lastTime !== 0 && isPlaying) {
      const deltaTime = (time - lastTime) / 1000 // seconds
      progress += speed * deltaTime

      if (progress >= 100) {
        progress = 0
        currentIndex++
        if (currentIndex >= pages.length - 1) {
          isPlaying = false
          progress = 100 // Keep it finished
        }
      }
    }
    lastTime = time
    animationFrameId = requestAnimationFrame(animate)
  }

  onMount(() => {
    paginate()
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  })

  // Re-paginate on text/style change or resize
  $: if (text && container && fontSize && lineHeight) {
    paginate()
  }

  // Handle user interaction
  function handleScroll() {
    // Scroll -> Pause
    isPlaying = false
  }

  function handleClick() {
    // Click -> Toggle Play/Pause
    isPlaying = !isPlaying
  }
</script>

<div
  class="rolling-blind-container"
  bind:this={container}
  style="background: {theme.background}; color: {theme.color}; font-size: {fontSize}px; line-height: {lineHeight};"
  on:wheel|passive={handleScroll}
  on:touchmove|passive={handleScroll}
  on:click={handleClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') handleClick()
  }}
>
  {#if pages.length > 0}
    <!-- Layer A (Background) - Current Page -->
    <div class="layer layer-a" style="background: {theme.background}; color: {theme.color};">
      {pages[currentIndex] || ''}
    </div>

    <!-- Layer B (Foreground) - Next Page -->
    {#if currentIndex + 1 < pages.length}
      <div
        class="layer-b-wrapper"
        style="height: {progress}%; background: {theme.background}; --line-color: {theme.color};"
      >
        <div
          class="layer layer-b-inner"
          style="background: {theme.background}; color: {theme.color};"
        >
          {pages[currentIndex + 1] || ''}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .rolling-blind-container {
    position: relative;
    width: 100%;
    height: 80vh; /* Fixed height as requested */
    overflow: hidden;
    /* Border removed */
  }

  .layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0; /* Removed padding to match normal view */
    box-sizing: border-box;
    white-space: pre-wrap;
    overflow: hidden;
  }

  .layer-a {
    z-index: 1;
  }

  /* Wrapper for Layer B to control visible height and border */
  .layer-b-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 2;
    overflow: hidden;
    box-sizing: content-box;
    opacity: 1 !important;
    /* Shadow removed for cleaner look with the dimmer line */
  }

  /* The Dimmer Line via Pseudo-element */
  .layer-b-wrapper::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--line-color);
    opacity: 0.3; /* Make it dimmer/softer */
    pointer-events: none;
  }

  /* Inner content of Layer B must stay full height relative to container */
  .layer-b-inner {
    height: 80vh; /* Must match container height */
  }
</style>
