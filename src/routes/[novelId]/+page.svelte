<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { novel, progress } = $derived(data);
	const {
		chapter_count,
		id,
		novel_author,
		novel_description,
		novel_genre,
		novel_image_link,
		novel_name
	} = $derived(novel);

	const genres = $derived(novel_genre.split(','));
</script>

<div class="min-h-[70dvh] px-4 py-6">
	<div class="flex flex-col gap-6 md:flex-row">
		<!-- Novel Cover Image -->
		<div class="md:w-1/3 lg:w-1/4">
			<img
				class="h-64 w-full rounded-md object-cover shadow-lg md:h-auto"
				src={novel_image_link}
				alt={`Cover of ${novel_name}`}
			/>
		</div>

		<!-- Novel Details -->
		<div class="flex-1">
			<h1 class="mb-2 text-2xl font-bold break-words text-gray-50 sm:text-3xl">{novel_name}</h1>
			<p class="text-chocolateCosmos-50 mb-4 text-sm font-medium">
				by <span class="font-semibold">{novel_author}</span>
			</p>

			<div class="mb-4 flex w-full flex-wrap gap-2">
				{#each genres as genre, i (i)}
					<span
						class="border-burgundy-500 text-burgundy-200 inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-xs font-medium whitespace-nowrap sm:text-sm"
					>
						{genre}
					</span>
				{/each}

				<span
					class="border-caribbeanCurrent-800 text-caribbeanCurrent-200 inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-xs font-medium sm:text-sm"
				>
					{chapter_count}
					{chapter_count === 1 ? 'Chapter' : 'Chapters'}
				</span>
			</div>

			<div class="mt-4">
				<h2 class="mb-2 text-lg font-semibold text-gray-100">Description</h2>
				<p class="text-sm leading-relaxed text-gray-300 sm:text-base">
					{novel_description}
				</p>
			</div>
			{#if progress?.last_chapter_number}
				<div class="mt-6">
					<a href={`/${id}/${progress.last_chapter_number}`}>
						<Button className="w-full">
							Resume chapter {progress.last_chapter_number}: {progress?.last_chapter_name}
						</Button>
					</a>
				</div>
			{/if}

			<div class="mt-6">
				<a href={`/${id}/1`}><Button className="w-full">Start Reading</Button></a>
			</div>
		</div>
	</div>
</div>
