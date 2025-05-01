<script lang="ts">
	import { navigating } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
	import LoadingPage from '../lib/components/LoadingPage.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	const { session, user } = $derived(data);

	let isNavigating = $derived(!!navigating.complete);
</script>

<Header {session} {user} />

<main class="bg-pennBlue-700 h-fit min-h-[70dvh] text-gray-200">
	{#if !isNavigating}
		<LoadingPage />
	{:else}
		{@render children()}
	{/if}
</main>

<Footer />
