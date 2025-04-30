<script lang="ts">
	import { Book, User, Menu, X } from 'lucide-svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	let { children, data }: LayoutProps = $props();
	const { session, user } = $derived(data);

	// State for mobile menu toggle
	let mobileMenuOpen = $state(false);

	// Function to toggle mobile menu
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<!-- Header/Navigation -->
<header class="border-b border-gray-800 bg-gray-900">
	<div class="flex w-full items-center justify-between px-4 py-4">
		<a href="/" class="flex items-center space-x-3">
			<span class="text-2xl text-violet-400">
				<Book />
			</span>
			<span class="text-xl font-bold text-gray-100">Blackbook</span>
		</a>

		<!-- Mobile menu button -->
		<button
			class="cursor-pointer text-gray-100 hover:text-violet-300 focus:outline-none md:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle menu"
		>
			{#if mobileMenuOpen}
				<X size={24} />
			{:else}
				<Menu size={24} />
			{/if}
		</button>

		<!-- Desktop navigation -->
		<nav class="hidden md:block">
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
							<form method="post" use:enhance>
								<button
									class="rounded bg-violet-700 px-3 py-1 text-sm text-white transition-colors hover:bg-violet-600"
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

	<!-- Mobile navigation menu -->
	{#if mobileMenuOpen}
		<div
			transition:slide={{ duration: 300, axis: 'y' }}
			class="border-t border-gray-800 bg-gray-900 px-4 py-4 md:hidden"
		>
			<ul class="flex flex-col space-y-4">
				{#if session}
					<li>
						{#if user?.id}
							<div class="flex items-center justify-between text-gray-200">
								<div class="flex items-center space-x-3">
									<span class="flex h-8 w-8 items-center justify-center rounded-full bg-violet-700">
										<User size={18} />
									</span>
									<span>{user.username}</span>
								</div>
								<form method="post" use:enhance class="mt-2">
									<button
										class="rounded bg-violet-700 px-3 py-1 text-sm text-white transition-colors hover:bg-violet-600"
									>
										Sign out
									</button>
								</form>
							</div>
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
							class="block w-full rounded bg-violet-700 px-4 py-2 text-center text-white transition-colors hover:bg-violet-600"
						>
							Login
						</a>
					</li>
				{/if}
			</ul>
		</div>
	{/if}
</header>

{@render children()}

<!-- Footer -->
<footer class="mt-auto border-t border-gray-800 bg-gray-900 py-8">
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
