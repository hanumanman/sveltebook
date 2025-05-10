<script lang="ts">
  import { cn } from '$lib/utils';

  type Props = {
    value: number;
    maxValue: number;
    class?: string;
  };

  let { value, maxValue, class: className }: Props = $props();
  const percentValue = Math.round((value / maxValue) * 100);
</script>

<!-- A Progress Bar component that displays the progress of a task. -->

<div
  class={cn('relative bg-gray-500 h-4 w-full overflow-hidden rounded-full shadow-inner', className)}
  style="background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent); background-size: 1rem 1rem;"
>
  <div
    class="absolute top-0 left-0 h-full bg-gradient-to-r from-burgundy-600 to-burgundy-400 transition-all duration-300 ease-out"
    style="width: {percentValue}%;"
  ></div>
</div>
