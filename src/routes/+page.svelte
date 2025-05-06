<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const { novels } = $derived(data);
</script>

<div class="min-h-screen px-4 py-8 text-gray-100 md:px-6 lg:px-8">
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {#each novels as novel (novel.id)}
      <a
        href={`/${novel.id}`}
        class="bg-pennBlue-900 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105 hover:brightness-110"
      >
        <img src={novel.novel_image_link} alt={novel.novel_name} class="h-48 w-full object-cover" />
        <div class="p-4">
          <h2 class="mb-2 text-xl font-semibold text-gray-300">{novel.novel_name}</h2>
          <p class="mb-3 line-clamp-3 text-sm text-gray-300">{novel.novel_description}</p>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap gap-2">
              {#each novel.novel_genre as genre, i (i)}
                <span class="bg-chocolateCosmos-500 rounded-md px-2 py-1 text-xs">
                  {genre}
                </span>
              {/each}
            </div>
            <Button>Read</Button>
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
