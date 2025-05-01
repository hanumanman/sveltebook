<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet<[]>;
		onclick?: () => void;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
	}

	let { children, onclick, type = 'button' }: Props = $props();
</script>

<button
	{type}
	{onclick}
	class="bg-burgundy-500 hover:bg-burgundy-600 rounded-lg px-4 py-3 text-white"
>
	{@render children()}
</button>
