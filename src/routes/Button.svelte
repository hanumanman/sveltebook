<script lang="ts">
	interface Props {
		text?: string;
	}

	let { text }: Props = $props();
	let state = $state(0);
</script>

<button
	class="grid cursor-pointer place-items-center rounded-lg border px-4 py-3"
	onclick={() => state++}
>
	{text ?? 'Clicked'}
	{state} times
</button>
