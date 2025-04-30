<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { novel, progress, user } = $derived(data);
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

<div class="min-h-screen bg-gray-900 px-4 py-6 text-gray-200">
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
			<p class="mb-4 text-sm font-medium text-violet-300">
				by <span class="font-semibold">{novel_author}</span>
			</p>

			<div class="mb-4 flex w-full flex-wrap gap-2">
				{#each genres as genre, i (i)}
					<span
						class="inline-flex items-center rounded-full border border-violet-800 bg-gray-800 px-3 py-1 text-xs font-medium whitespace-nowrap text-violet-200 sm:text-sm"
					>
						{genre}
					</span>
				{/each}

				<span
					class="inline-flex items-center rounded-full border border-emerald-800 bg-gray-800 px-3 py-1 text-xs font-medium text-emerald-200 sm:text-sm"
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
					<a
						href={`/${id}/${progress.last_chapter_number}`}
						class="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-violet-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
					>
						Resume chapter {progress.last_chapter_number}: {progress?.last_chapter_name}
					</a>
				</div>
			{/if}

			<div class="mt-6">
				<a
					href={`/${id}/1`}
					class="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-violet-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
				>
					Start Reading
				</a>
			</div>
		</div>
	</div>
</div>
