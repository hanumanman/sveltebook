<script lang="ts">
  import { Speaker } from 'lucide-svelte'

  interface Props {
    text: string
  }

  let { text }: Props = $props()
  async function getStream() {
    const res = await fetch('/api/stream', {
      method: 'POST',
      body: JSON.stringify({ text })
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      if (!reader) {
        break
      }
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      const chunkOfText = decoder.decode(value)
      console.log(chunkOfText)
    }
  }
</script>

<button
  onclick={getStream}
  class="hover:bg-pennBlue-600 cursor-pointer rounded-lg border border-gray-300 p-3 dark:border-gray-700"
  title="Open Settings Dialog"
>
  <Speaker size={20} />
</button>
