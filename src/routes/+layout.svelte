<script lang="ts">
  import { browser } from '$app/environment'
  import { navigating } from '$app/state'
  import Header from '$lib/components/Header.svelte'
  import LoadingPage from '$lib/components/LoadingPage.svelte'
  import { setAudioPlayerContext } from '$lib/services/AudioPlayer.svelte'
  import { onMount } from 'svelte'

  import '../app.css'
  import Footer from '../lib/components/Footer.svelte'
  import type { LayoutProps } from './$types'

  let { children, data }: LayoutProps = $props()
  const { session, user } = $derived(data)

  onMount(() => {
    if (browser) {
      setAudioPlayerContext()
    }
  })

  let isNavigating = $derived(!!navigating.complete)
</script>

<Header {session} {user} />

<main class="h-fit min-h-[70dvh] bg-gray-900 text-gray-200">
  {#if isNavigating}
    <LoadingPage />
  {:else}
    {@render children()}
  {/if}
</main>

<Footer />
