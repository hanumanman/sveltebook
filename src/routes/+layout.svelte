<script lang="ts">
	import '../app.css';
	import LoadingPage from './LoadingPage.svelte';

	import { enhance } from '$app/forms';
	import { navigating } from '$app/state';
	import { Book, User } from 'lucide-svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	const { session, user } = $derived(data);

	let isNavigating = $derived(!!navigating.complete);
</script>

<!-- Header/Navigation -->
<header
	id="blackbook-header"
	class="flex h-[10dvh] flex-col justify-center border-b border-gray-800 bg-gray-900"
>
	<div class="absolute flex w-full items-center justify-between px-4 py-4">
		<a href="/" class="flex items-center space-x-3">
			<span class="text-2xl text-violet-400">
				<Book />
			</span>
			<span class="text-xl font-bold text-gray-100">Blackbook</span>
		</a>

		<!-- Desktop navigation -->
		<nav class=" md:block">
			<ul class="flex items-center space-x-6">
				{#if session}
					<li class="flex items-center space-x-3">
						{#if user?.id}
							<div class="flex items-center space-x-3 text-gray-200">
								<span class="flex h-8 w-8 items-center justify-center rounded-full bg-violet-700">
									<User size={18} />
								</span>
								<span>{user.username}</span>
							</div>
							<form method="post" action="/logout" use:enhance>
								<button
									type="submit"
									class="cursor-pointer rounded bg-violet-700 px-3 py-1 text-sm text-white transition-colors hover:bg-violet-600"
								>
									Sign out
								</button>
							</form>
						{:else}
							<span class="flex h-8 w-8 items-center justify-center rounded-full bg-violet-700">
								<User size={18} />
							</span>
						{/if}
					</li>
				{:else}
					<li>
						<a
							href="/login/google"
							data-sveltekit-preload-data="off"
							class="rounded bg-violet-700 px-4 py-2 text-white transition-colors hover:bg-violet-600"
						>
							Login
						</a>
					</li>
				{/if}
			</ul>
		</nav>
	</div>
</header>

<div class="h-fit min-h-[70dvh] bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	<main>
		{#if isNavigating}
			<LoadingPage />
		{:else}
			{@render children()}
		{/if}
	</main>
</div>

<!-- Footer -->
<footer
	id="blackbook-footer"
	class="mt-auto flex h-[20dvh] flex-col justify-center border-t border-gray-800 bg-gray-900 py-8"
>
	<div class="mx-auto max-w-screen-lg px-4">
		<div class="flex flex-col items-center justify-between md:flex-row">
			<div class="mb-4 flex items-center space-x-3 md:mb-0">
				<span class="text-xl text-gray-200">
					<Book />
				</span>
				<span class="font-semibold text-gray-100">Blackbook</span>
			</div>

			<div class="text-sm text-gray-400">
				<p>© {new Date().getFullYear()} Blackbook. All rights reserved.</p>
			</div>
		</div>

		<div class="mt-6 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
			<p>Your portal to countless worlds of fiction.</p>
		</div>
	</div>
</footer>
