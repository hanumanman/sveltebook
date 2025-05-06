<script lang="ts">
  import { LoaderCircle } from 'lucide-svelte';
</script>

<div class="flex h-[70dvh] flex-col items-center justify-center gap-2">
  <div class="animate-spin">
    <LoaderCircle size={64} />
  </div>
  <p class="animate-pulse font-extrabold">Loading...</p>
</div>
