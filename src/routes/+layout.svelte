<script lang="ts">
	import { navigating } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import Footer from './Footer.svelte';
	import LoadingPage from './LoadingPage.svelte';

	let { children, data }: LayoutProps = $props();
	const { session, user } = $derived(data);

	let isNavigating = $derived(!!navigating.complete);
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
