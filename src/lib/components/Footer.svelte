<script>
  import { Book } from 'lucide-svelte'
</script>

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
