<script lang="ts">
	import { Book, BookAIcon } from 'lucide-svelte';
	import '../app.css';

	let { children } = $props();
</script>

<!-- Header/Navigation -->
<header class="border-b border-gray-800 bg-gray-900">
	<div class="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-4">
		<a href="/" class="flex items-center space-x-3">
			<span class="text-2xl text-gray-200">
				<Book />
			</span>
			<span class="text-xl font-bold text-gray-100">Blackbook</span>
		</a>
		<nav>
			<ul class="flex space-x-6">
				<li><a href="/" class="text-gray-300 transition-colors hover:text-violet-300">Home</a></li>
			</ul>
		</nav>
	</div>
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
