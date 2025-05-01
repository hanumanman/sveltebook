<script lang="ts">
	import { enhance } from '$app/forms';
	import { preloadData } from '$app/navigation';
	import { plainContentToParagraphs, scrollPage } from '$lib/utils';
	import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { chapter_content, chapter_name, chapter_number, novel_id } = $derived(data);
	const prevChapter = $derived(chapter_number - 1);
	const nextChapter = $derived(chapter_number + 1);
	const paragraphs = $derived(plainContentToParagraphs(chapter_content));

	// TODO: Add logic to determine if next chapter exists
	const hasNextChapter = $derived(true); // Replace with actual logic
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
</script>

<!-- Hidden form to store values -->
<form class="hidden" method="post" use:enhance bind:this={progressForm}>
	<input type="text" name="lastChapterName" value={chapter_name} />
	<input type="text" name="chapterNumber" value={chapter_number} />
</form>

<div class="flex w-full max-w-lg flex-col justify-between p-4">
	<!-- Back to Novel Link -->
	<a
		href="/{novel_id}"
		class="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
	>
		<ChevronLeft size={20} />
		<span>Back to Novel</span>
	</a>

	<!-- Chapter Title -->
	<div class="mb-6 flex items-end justify-between gap-4 border-b border-gray-500 pb-6">
		<div>
			<h1 class="pb-3 text-2xl text-gray-600 dark:text-gray-400">Chapter {chapter_number}</h1>
			<h2 class="mb-1 text-3xl font-bold">{chapter_name}</h2>
		</div>

		<!-- Chapter Navigation -->
		<div class="flex justify-end gap-2">
			<button
				onclick={() => scrollPage('bottom')}
				class="cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
				title="Scroll to Bottom"
			>
				<ChevronDown size={20} />
			</button>

			{#if hasPrevChapter}
				<a
					href="/{novel_id}/{prevChapter}"
					class="rounded-lg border border-gray-300 p-3 dark:border-gray-700"
					title="Previous Chapter"
				>
					<ChevronLeft size={20} />
				</a>
			{/if}

			{#if hasNextChapter}
				<a
					href="/{novel_id}/{nextChapter}"
					class="rounded-lg border border-gray-300 p-3 dark:border-gray-700"
					title="Next Chapter"
				>
					<ChevronRight size={20} />
				</a>
			{/if}
		</div>
	</div>

	<!-- Chapter Content -->
	<article class="prose prose-lg dark:prose-invert max-w-none pb-4">
		{#each paragraphs as paragraph, i (i)}
			<p>{paragraph}</p>
		{/each}
	</article>

	<!-- Bottom Chapter Navigation -->
	<div class="flex flex-col gap-2 border-t border-b border-gray-200 pt-4 dark:border-gray-700">
		{#if hasNextChapter}
			<a href="/{novel_id}/{nextChapter}" class="">
				<button
					class="grid w-full cursor-pointer place-items-center rounded-lg border bg-gray-100 p-3 text-black hover:bg-gray-300"
				>
					<div class="flex items-center gap-2">
						<span>Next Chapter</span>
						<ChevronRight size={20} />
					</div>
				</button>
			</a>
		{:else}
			<div></div>
		{/if}

		{#if hasPrevChapter}
			<a
				href="/{novel_id}/{prevChapter}"
				class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
			>
				<button
					class="grid w-full cursor-pointer place-items-center rounded-lg border border-gray-700 p-3 dark:border-gray-300"
				>
					<div class="flex items-center gap-2">
						<ChevronLeft size={20} />
						<span>Previous Chapter</span>
					</div>
				</button>
			</a>
		{:else}
			<div></div>
		{/if}
		<button
			class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-700 p-3 dark:border-gray-300"
			onclick={() => scrollPage('top')}
		>
			<span>Go to Top</span>
			<ChevronUp size={20} />
		</button>
	</div>
</div>
