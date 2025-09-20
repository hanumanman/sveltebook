<script lang="ts">
  import { dev } from '$app/environment'
  import { enhance } from '$app/forms'
  import Button from '$lib/components/Button.svelte'
  import Dropzone from 'svelte-file-dropzone'

  interface IDropEvent {
    detail: {
      acceptedFiles: File[]
      fileRejections: File[]
    }
  }

  let novelId = $state('')
  let text = $state('')
  let file = $state<File>()

  function handleFilesSelect(e: IDropEvent): void {
    const { acceptedFiles, fileRejections } = e.detail
    if (!acceptedFiles || acceptedFiles.length === 0) {
      return
    }

    file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (e): void => {
      const result = e.target?.result
      if (typeof result === 'string') {
        text = result
      }
    }
    reader.readAsText(file)
  }
</script>

{#if dev}
  <div class="flex flex-col gap-2 items-center">
    <Dropzone on:drop={handleFilesSelect} />
    <p>{file?.name}</p>
    <form action="?/upload" method="POST" use:enhance>
      <textarea class="hidden" name="text" bind:value={text}></textarea>
      <input
        class="border border-slate-500 rounded-lg mb-2"
        name="novelId"
        type="number"
        bind:value={novelId}
      />
      <Button type="submit">Upload new book</Button>
    </form>

    <form action="?/update" method="POST" use:enhance>
      <textarea class="hidden" name="text" bind:value={text}></textarea>
      <input
        class="border border-slate-500 rounded-lg mb-2"
        name="novelId"
        type="number"
        bind:value={novelId}
      />
      <Button type="submit">Update book</Button>
    </form>
  </div>
{/if}
