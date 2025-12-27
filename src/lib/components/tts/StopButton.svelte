<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'
  import { Square } from 'lucide-svelte'

  interface Props {
    compact?: boolean
  }

  let { compact = false }: Props = $props()
  const player = $derived(TikTokPlayer.getInstance())
</script>

<button
  onclick={() => player.stop()}
  disabled={player.playbackState === 'stopped'}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300
         {compact ? 'p-2' : 'p-2 sm:p-3'}
         dark:border-gray-700
         disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label="Stop"
>
  <Square size={compact ? 16 : 18} class="sm:w-5 sm:h-5" />
</button>
