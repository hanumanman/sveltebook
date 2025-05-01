<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet<[]>;
		onclick?: () => void;
		type?: 'button' | 'submit' | 'reset';
		className?: string;
	}

	let { children, onclick, type = 'button', className }: Props = $props();
</script>

<button
	{type}
	{onclick}
	class={cn(
		'bg-burgundy-500 hover:bg-burgundy-400 hover:inset-shadow-burgundy-400/2 flex cursor-pointer items-center justify-center  gap-2 rounded-lg px-3 py-2 text-center text-white transition-colors duration-200 hover:inset-shadow-sm',
		className
	)}
>
	{@render children()}
</button>
