<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { cn } from '$lib/utils'

  interface Props {
    compact?: boolean
    class?: string
  }

  let { compact = false, class: className }: Props = $props()
  const player = $derived(TikTokPlayer.getInstance())

  const progressPercentage = $derived(() => {
    const currentChunk = player.getCurrentChunkNumber
    const totalChunks = player.getTotalChunks
    return totalChunks > 0 ? (currentChunk / totalChunks) * 100 : 0
  })
</script>

<div
  class={cn('w-full bg-gray-500 rounded-full overflow-hidden', compact ? 'h-2' : 'h-4', className)}
  role="progressbar"
  aria-valuenow={progressPercentage()}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Playback progress"
>
  <div
    class="h-full bg-gradient-to-r from-burgundy-600 to-burgundy-400
           transition-all duration-300 ease-out"
    style="width: {progressPercentage()}%;"
  ></div>
</div>
