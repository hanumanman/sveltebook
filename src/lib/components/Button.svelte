<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type ButtonProps = HTMLButtonAttributes & {
    children: Snippet<[]>;
  };

  let { children, class: className, ...props }: ButtonProps = $props();
</script>

<button
  {...props}
  class={cn(
    'bg-burgundy-500 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-white transition-all duration-200 hover:inset-shadow-sm hover:brightness-125',
    className
  )}
>
  {@render children()}
</button>
