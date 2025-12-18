<script lang="ts">
  import { onMount } from 'svelte'

  export let text: string = ''
  export let isPlaying: boolean = false
  export let speed: number = 20
  export let startRatio: number = 0
  export let fontSize: number = 16
  export let lineHeight: number = 1.6
  export let theme: { background: string; color: string } = { background: 'white', color: 'black' }

  let container: HTMLDivElement
  let pages: string[] = []
  let currentIndex: number = 0
  let progress: number = 0 // 0 to 100
  let lastTime: number = 0
  let animationFrameId: number

  function resetState() {
    pages = []
    currentIndex = 0
    progress = 0
  }

  function createMeasureDiv() {
    const measureDiv = document.createElement('div')
    measureDiv.style.position = 'absolute'
    measureDiv.style.visibility = 'hidden'
    measureDiv.style.width = `${container.clientWidth}px`
    measureDiv.style.height = `${container.clientHeight}px`
    measureDiv.style.padding = '0'
    measureDiv.style.boxSizing = 'border-box'
    measureDiv.style.fontSize = `${fontSize}px`
    measureDiv.style.lineHeight = `${lineHeight}`
    measureDiv.style.fontFamily = getComputedStyle(container).fontFamily
    measureDiv.style.whiteSpace = 'pre-wrap'
    try {
      document.body.appendChild(measureDiv)
    } catch (_error) {
      throw new Error('Failed to create measurement div')
    }
    return measureDiv
  }

  function processWords(measureDiv: HTMLElement, words: string[], startRatio: number) {
    const pageArray: string[] = []
    let currentPage = ''
    let charCount = 0
    const totalChars = text.length
    const targetCharIndex = startRatio * totalChars
    let startPageIndex = 0

    for (const word of words) {
      const testPage = currentPage + word
      measureDiv.textContent = testPage

      if (measureDiv.scrollHeight <= measureDiv.clientHeight || currentPage.length === 0) {
        currentPage = testPage
        continue
      }

      pageArray.push(currentPage)
      if (charCount <= targetCharIndex) {
        startPageIndex = pageArray.length - 1
      }
      charCount += currentPage.length
      currentPage = word
      measureDiv.textContent = currentPage
    }

    if (!currentPage) return { pages: pageArray, startPageIndex }

    pageArray.push(currentPage)
    if (charCount <= targetCharIndex) {
      startPageIndex = pageArray.length - 1
    }

    return { pages: pageArray, startPageIndex }
  }

  function setStartPage(startPageIndex: number) {
    if (startRatio > 0 && startPageIndex > 0) {
      currentIndex = startPageIndex
    }
  }

  async function paginate() {
    if (!container || !text) return

    resetState()

    const measureDiv = createMeasureDiv()
    const words = text.split(/(\s+)/)

    const { pages: newPages, startPageIndex } = processWords(measureDiv, words, startRatio)
    pages = newPages

    try {
      document.body.removeChild(measureDiv)
    } catch (error) {
      console.error('Failed to remove measurement div', error)
    }

    setStartPage(startPageIndex)
  }

  function animate(time: number) {
    if (lastTime === 0 || !isPlaying) {
      lastTime = time
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    const deltaTime = (time - lastTime) / 1000
    progress += speed * deltaTime

    if (progress < 100) {
      lastTime = time
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    progress = 0
    currentIndex++

    if (currentIndex < pages.length - 1) {
      lastTime = time
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    isPlaying = false
    progress = 100
    lastTime = time
    animationFrameId = requestAnimationFrame(animate)
  }

  onMount(() => {
    paginate()
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  })

  $: if (text && container && fontSize && lineHeight) {
    paginate()
  }

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
  class="relative w-full h-[80vh] overflow-hidden bg-[{theme.background}] text-[{theme.color}] text-[{fontSize}px] leading-[{lineHeight}]"
  bind:this={container}
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
    <div
      class="absolute top-0 left-0 w-full h-full p-0 box-border whitespace-pre-wrap overflow-hidden z-1 bg-[{theme.background}] text-[{theme.color}]"
    >
      {pages[currentIndex] || ''}
    </div>

    <!-- Layer B (Foreground) - Next Page -->
    {#if currentIndex + 1 < pages.length}
      <div
        class="absolute top-0 left-0 w-full z-2 overflow-hidden box-content opacity-100 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[var(--line-color)] after:opacity-30 after:pointer-events-none bg-[{theme.background}]"
        style="height: {progress}%; --line-color: {theme.color};"
      >
        <div
          class="h-[80vh] absolute top-0 left-0 w-full p-0 box-border whitespace-pre-wrap overflow-hidden bg-[{theme.background}] text-[{theme.color}]"
        >
          {pages[currentIndex + 1] || ''}
        </div>
      </div>
    {/if}
  {/if}
</div>
