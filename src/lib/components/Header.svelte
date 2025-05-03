<script lang="ts">
	import { enhance } from '$app/forms';
	import { Book, User } from 'lucide-svelte';
	import Button from './Button.svelte';

	const { session, user } = $props();
</script>

<header id="blackbook-header" class="bg-pennBlue-900 flex h-[10dvh] flex-col justify-center">
	<div class="absolute flex w-full items-center justify-between px-4 py-4">
		<a href="/" class="flex items-center space-x-3">
			<span class="text-2xl text-gray-400">
				<Book />
			</span>
			<span class="text-xl font-bold text-gray-100">Blackbook</span>
		</a>

		<nav class=" md:block">
			<ul class="flex items-center space-x-6">
				{#if session}
					<li class="flex items-center space-x-3">
						{#if user?.id}
							<div class="flex items-center gap-2 text-gray-200">
								<span class="bg-burgundy-500 flex h-8 w-8 items-center justify-center rounded-full">
									<User size={18} />
								</span>
								<span>{user.username.split(' ')[0]}</span>
							</div>
							<form method="post" action="/logout" use:enhance>
								<Button class="text-sm" type="submit">Logout</Button>
							</form>
						{:else}
							<span class="flex h-8 w-8 items-center justify-center rounded-full">
								<User size={18} />
							</span>
						{/if}
					</li>
				{:else}
					<li>
						<a href="/login/google" data-sveltekit-preload-data="off">
							<Button>Login</Button>
						</a>
					</li>
				{/if}
			</ul>
		</nav>
	</div>
</header>
