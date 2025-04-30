<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const { novels } = $derived(data);
</script>

<div class="min-h-screen bg-gray-900 px-4 py-8 text-gray-100 md:px-6 lg:px-8">
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each novels as novel (novel.id)}
			<a
				href={`/${novel.id}`}
				class="overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-transform
				hover:scale-105"
			>
				<img src={novel.novel_image_link} alt={novel.novel_name} class="h-48 w-full object-cover" />
				<div class="p-4">
					<h2 class="mb-2 text-xl font-semibold text-indigo-300">{novel.novel_name}</h2>
					<p class="mb-3 line-clamp-3 text-sm text-gray-300">{novel.novel_description}</p>
					<div class="flex flex-col gap-3">
						<div class="flex flex-wrap gap-2">
							{#each novel.novel_genre as genre, i (i)}
								<span class="rounded-md bg-indigo-900 px-2 py-1 text-xs text-indigo-200">
									{genre}
								</span>
							{/each}
						</div>
						<div
							class="grid w-full place-items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
						>
							Read
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
