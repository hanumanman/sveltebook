<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import { flip } from 'svelte/animate'

  import type { PageProps } from './$types'
  import { searchHomepage } from './search'

  let { data }: PageProps = $props()
  const { novels } = $derived(data)

  let searchTerm = $state('')

  let results = $derived(
    searchHomepage({
      searchTerm,
      novels
    })
  )
</script>

<svelte:head>
  <title>Blackbook</title>
  <meta name="description" content="List of novels available." />
</svelte:head>

<div class="min-h-screen px-4 py-8 text-gray-100 md:px-6 lg:px-8">
  <div class="mb-6 flex items-center justify-center">
    <input
      bind:value={searchTerm}
      placeholder="Search for a novel"
      class="border border-gray-500 rounded-lg px-4 py-2 w-full max-w-lg"
      type="text"
    />
  </div>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {#each results as result (result?.id)}
      <a
        animate:flip={{ duration: 200 }}
        href={`/${result?.id}`}
        class="bg-pennBlue-900 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105 hover:brightness-110"
      >
        <enhanced:img
          src={result?.novel_image_link || ''}
          alt={result?.novel_name}
          class="h-48 w-full object-cover"
        />
        <div class="p-4">
          {#if result?.highlightName}
            <h2 class="mb-2 text-xl font-semibold text-gray-300 line-clamp-2 h-14">
              {@html result.processedString}
            </h2>
            <p class="mb-1 text-sm font-medium text-gray-400">{result.novel_author}</p>
          {:else}
            <h2 class="mb-2 text-xl font-semibold text-gray-300 line-clamp-2 h-14">
              {result.novel_name}
            </h2>
            <p class="mb-1 text-sm font-medium text-gray-400">{@html result.processedString}</p>
          {/if}

          <p class="mb-3 line-clamp-3 text-sm text-gray-300">{result.novel_description}</p>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap gap-2">
              {#each result.novel_genre as genre, i (i)}
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
