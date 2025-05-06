<script>
  import { page } from '$app/state';
  import Button from '$lib/components/Button.svelte';
</script>

<div
  class="flex min-h-[70dvh] items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12 sm:px-6 lg:px-8"
>
  <div class="text-center">
    <div class="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-10 w-10 text-gray-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>

    <h1 class="mb-2 text-5xl font-extrabold text-gray-200">
      {page.status}
    </h1>

    {#if page.error?.message}
      <p class="mt-4 text-lg text-gray-300">
        {page.error.message}
      </p>
    {:else}
      <p class="mt-4 text-lg text-gray-300">An unexpected error occurred</p>
    {/if}

    <div class="mt-8">
      <a href="/"
        ><Button class="px-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-2 -ml-1 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Return Home
        </Button></a
      >
    </div>
  </div>
</div>
