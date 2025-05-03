<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { pageSettingsStore } from './pageSettingsStore';

	interface Props {
		open: boolean;
		toggleDialogFn: () => void;
	}

	let { open, toggleDialogFn } = $props();
</script>

<dialog {open} class="h-[100dvh] w-full bg-transparent">
	<div class="grid h-full w-full place-items-center">
		<div
			class="bg-pennBlue-900 flex w-fit max-w-lg flex-col items-center justify-center gap-4 rounded-lg border-2 border-gray-400 p-4 text-gray-300 md:p-6"
		>
			<div class="w-full">
				<h2>Font size</h2>
				<div class="flex w-full gap-2">
					<input
						type="range"
						class="grow"
						bind:value={$pageSettingsStore.fontSize}
						min="12"
						max="24"
						step="0.1"
					/>
					<p>{$pageSettingsStore.fontSize} px</p>
				</div>
			</div>
			<div class="w-full">
				<h2>Line height</h2>
				<div class="flex w-full gap-2">
					<input
						type="range"
						class="grow"
						bind:value={$pageSettingsStore.lineHeight}
						min="0"
						max="5"
						step="0.1"
					/>
					<p>{$pageSettingsStore.lineHeight}</p>
				</div>
			</div>
			<p
				class="line-clamp-3"
				style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};"
			>
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam, consectetur sunt, aliquam
				corrupti cupiditate doloremque, ipsum suscipit adipisci maxime itaque beatae quae delectus
				inventore nihil. Veniam ut nostrum voluptates eaque.
			</p>
			<div class="flex gap-2">
				<Button onclick={toggleDialogFn}>Save</Button>
				<Button
					onclick={() => {
						$pageSettingsStore = {
							fontSize: 16,
							lineHeight: 1.5
						};
					}}>Reset</Button
				>
			</div>
		</div>
	</div>
</dialog>
