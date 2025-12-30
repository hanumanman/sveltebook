<script lang="ts">
  import TikTokPlayer from '$lib/services/tiktokPlayer.svelte'

  const player = $derived(TikTokPlayer.getInstance())
  const state = $derived(player.playbackState)
</script>

<div class="border border-gray-300 dark:border-gray-700 grow hover:bg-pennBlue-600 p-2 rounded-lg">
  {state}
</div>
