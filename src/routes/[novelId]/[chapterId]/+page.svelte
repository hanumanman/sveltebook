<script lang="ts">
	import PageSettingsDialog from './PageSettingsDialog.svelte';

	import { enhance } from '$app/forms';
	import { preloadData } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import LinkButton from '$lib/components/LinkButton.svelte';
	import { plainContentToParagraphs, scrollPage } from '$lib/utils';
	import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Settings } from 'lucide-svelte';
	import type { PageProps } from './$types';
	import { pageSettingsStore } from './pageSettingsStore';

	let { data }: PageProps = $props();
	const { chapter_content, chapter_name, chapter_number, novel_id } = $derived(data.chapter);
	const prevChapter = $derived(chapter_number - 1);
	const nextChapter = $derived(chapter_number + 1);
	const paragraphs = $derived(plainContentToParagraphs(chapter_content));

	const hasNextChapter = $derived(chapter_number < data.chapter_count);
	const hasPrevChapter = $derived(prevChapter > 0);

	// Reference to the form element
	let progressForm: HTMLFormElement;

	function saveProgress() {
		if (progressForm) {
			const formData = new FormData(progressForm);
			const url = progressForm.action;

			fetch(url, { method: 'POST', body: formData });
		}
	}

	$effect(() => {
		if (hasNextChapter) {
			preloadData(`/${novel_id}/${nextChapter}`);
		}
		// Save progress whenever the chapter changes
		saveProgress();
	});

	// let settingsDialog: HTMLDialogElement;
	// function toggleDialog() {
	// 	if (settingsDialog.open) {
	// 		settingsDialog.close();
	// 	} else {
	// 		settingsDialog.showModal();
	// 	}
	// }

	let openSettingsDialog = $state(false);
	function toggleSettingsDialog() {
		openSettingsDialog = !openSettingsDialog;
	}
</script>

<div class="mx-auto flex w-full max-w-lg flex-col justify-between p-4">
	<!-- Back to Novel Link -->
	<a
		href="/{novel_id}"
		class="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
	>
		<ChevronLeft size={20} />
		<span>Back to Novel</span>
	</a>

	<!-- Chapter Title -->
	<div class="mb-6 gap-4 border-b border-gray-500 pb-6">
		<div>
			<h1 class="pb-3 text-xl text-gray-600 dark:text-gray-400">Chapter {chapter_number}</h1>
			<h2 class="mb-1 text-3xl font-bold">{chapter_name}</h2>
		</div>

		<!-- Page Controls -->
		<div class="flex justify-end gap-2 pt-3">
			<button
				onclick={toggleSettingsDialog}
				class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
				title="Open Settings Dialog"
			>
				<Settings size={20} />
			</button>
			<button
				onclick={() => scrollPage('bottom')}
				class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
				title="Scroll to Bottom"
			>
				<ChevronDown size={20} />
			</button>

			{#if hasPrevChapter}
				<a
					href="/{novel_id}/{prevChapter}"
					class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
					title="Previous Chapter"
				>
					<ChevronLeft size={20} />
				</a>
			{/if}

			{#if hasNextChapter}
				<a
					href="/{novel_id}/{nextChapter}"
					class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
					title="Next Chapter"
				>
					<ChevronRight size={20} />
				</a>
			{/if}
		</div>
	</div>

	<!-- Chapter Content -->
	<article
		style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};"
		class="prose prose-lg dark:prose-invert max-w-none pb-4"
	>
		{#each paragraphs as paragraph, i (i)}
			<p>{paragraph}</p>
		{/each}
	</article>

	{#if !hasNextChapter}
		<div class="flex justify-center pb-3">
			<span>You have caught up!</span>
		</div>
	{/if}

	<!-- Bottom Chapter Navigation -->
	<div class="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
		{#if hasNextChapter}
			<LinkButton class="border border-gray-700" href="/{novel_id}/{nextChapter}">
				Next Chapter
				<ChevronRight size={20} />
			</LinkButton>
		{:else}
			<div></div>
		{/if}

		{#if hasPrevChapter}
			<LinkButton
				href="/{novel_id}/{prevChapter}"
				class="bg-pennBlue-900 w-full border border-gray-700"
			>
				<div class="flex items-center gap-2">
					<ChevronLeft size={20} />
					<span>Previous Chapter</span>
				</div>
			</LinkButton>
		{:else}
			<div></div>
		{/if}
		<Button class="bg-pennBlue-900 w-full border border-gray-700" onclick={() => scrollPage('top')}>
			<span>Go to Top</span>
			<ChevronUp size={20} />
		</Button>
	</div>
</div>

<!-- Settings dialog -->
<PageSettingsDialog open={openSettingsDialog} toggleDialogFn={toggleSettingsDialog} />

<!-- Hidden form to store progress values -->
<form class="hidden" method="post" use:enhance bind:this={progressForm}>
	<input type="text" name="lastChapterName" value={chapter_name} />
	<input type="text" name="chapterNumber" value={chapter_number} />
</form>
