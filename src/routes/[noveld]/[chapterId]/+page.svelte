<script lang="ts">
	import { plainContentToParagraphs } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { chapter_content, chapter_name, chapter_number } = $derived(data);
	const prevChapter = $derived(data.chapter_number - 1);
	const nextChapter = $derived(data.chapter_number + 1);
	const paragraphs = $derived(plainContentToParagraphs(chapter_content));
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6">
		<div class="mt-10 flex justify-between">
			{#if prevChapter > 0}
				<a
					data-sveltekit-preload-data="hover"
					href="/{data.novel_id}/{prevChapter}"
					class="flex items-center rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
				>
					<span class="mr-2">←</span> Go to chapter {prevChapter}
				</a>
			{:else}
				<div></div>
			{/if}

			<a
				data-sveltekit-preload-data="hover"
				href="/{data.novel_id}/{nextChapter}"
				class="flex items-center rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
			>
				Go to Chapter {nextChapter} <span class="ml-2">→</span>
			</a>
		</div>
		<span class="text-sm font-medium text-gray-500">Chapter {chapter_number}</span>
		<h1 class="mt-2 mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">{chapter_name}</h1>
	</div>

	<article
		class="prose prose-lg prose-headings:text-gray-900 prose-a:text-blue-600 max-w-none text-gray-700"
	>
		{#each paragraphs as paragraph}
			<p>{@html paragraph}</p>
		{/each}
	</article>
</div>
