<script lang="ts">
  import { cn } from '$lib/utils'
  import type { Snippet } from 'svelte'
  import type { HTMLAnchorAttributes } from 'svelte/elements'

  type LinkButtonProps = HTMLAnchorAttributes & {
    children?: Snippet<[]>
  }

  let { children, href = '/', class: className, ...props }: LinkButtonProps = $props()
</script>

<a
  {href}
  {...props}
  class={cn(
    'bg-burgundy-500 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3  py-2 text-center text-white transition-all duration-300 hover:inset-shadow-sm hover:brightness-125',
    className
  )}
>
  {#if children}
    {@render children()}
  {/if}
</a>
