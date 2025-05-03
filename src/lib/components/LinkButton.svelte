<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet<[]>;
		href?: string;
		class?: string;
	}

	let { children, href = '/', class: className }: Props = $props();
</script>

<a
	{href}
	class={cn(
		'bg-burgundy-500 hover:inset-shadow-burgundy-400/2 flex cursor-pointer items-center justify-center gap-2  rounded-lg px-3 py-2 text-center text-white transition-colors duration-200 hover:inset-shadow-sm hover:brightness-125',
		className
	)}
>
	{@render children()}
</a>
