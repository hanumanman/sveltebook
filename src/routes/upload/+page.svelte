<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import Button from '$lib/components/Button.svelte'
  import Dropzone from 'svelte-file-dropzone'
  import type { PageData } from './$types'

  export let data: PageData

  let mode: 'upload' | 'create' = 'upload'
  let selectedNovelId = ''
  let text = ''
  let file: File | undefined
  let parsedChapters: { number: string; title: string }[] = []
  let isUploading = false
  let uploadStatus = ''

  function handleFilesSelect(e: CustomEvent) {
    const { acceptedFiles } = e.detail
    if (!acceptedFiles || acceptedFiles.length === 0) return

    file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        text = result
        parseChapters(text)
      }
    }
    if (file) {
      reader.readAsText(file)
    }
  }

  function parseChapters(content: string) {
    const chapterRegex = /(?:CHƯƠNG|Chương) (\d+):\s*([^\n]+)/g
    const chapters = []
    let match
    while ((match = chapterRegex.exec(content)) !== null) {
      chapters.push({
        number: match[1],
        title: match[2].trim()
      })
    }
    parsedChapters = chapters
  }

  function handleCreateResult({ result }: { result: any }) {
    if (result.type === 'success') {
      uploadStatus = 'Novel created successfully! You can now upload chapters.'
      invalidateAll().then(() => {
        if (result.data?.novelId) {
          selectedNovelId = result.data.novelId.toString()
          mode = 'upload'
        }
      })
    }
  }

  function handleUploadResult({ result }: { result: any }) {
    isUploading = false
    if (result.type === 'success') {
      uploadStatus = 'Chapters uploaded/updated successfully!'
      // Clear file selection? Maybe keep it in case they want to do more?
      // text = ''
      // file = undefined
      // parsedChapters = []
    } else {
      uploadStatus = 'Error uploading chapters.'
    }
  }
</script>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-3xl font-bold mb-8 text-gray-800">Book Management</h1>

  <div class="flex gap-4 mb-8 border-b border-gray-200 pb-4">
    <button
      class="px-6 py-2 rounded-full font-medium transition-colors {mode === 'upload'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
      on:click={() => (mode = 'upload')}
    >
      Upload / Update Chapters
    </button>
    <button
      class="px-6 py-2 rounded-full font-medium transition-colors {mode === 'create'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
      on:click={() => (mode = 'create')}
    >
      Create New Novel
    </button>
  </div>

  {#if uploadStatus}
    <div class="p-4 mb-6 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      {uploadStatus}
    </div>
  {/if}

  {#if mode === 'upload'}
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <form
        action="?/update"
        method="POST"
        use:enhance={() => {
          isUploading = true
          uploadStatus = ''
          return handleUploadResult
        }}
        class="flex flex-col gap-6"
      >
        <div>
          <label for="novelId" class="block text-sm font-medium text-gray-700 mb-2">Select Novel</label>
          <select
            id="novelId"
            name="novelId"
            bind:value={selectedNovelId}
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          >
            <option value="" disabled>-- Choose a book --</option>
            {#each data.novels as novel}
              <option value={novel.id}>{novel.novel_name} (ID: {novel.id})</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Upload Text File</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-1 hover:border-blue-500 transition-colors">
            <Dropzone
              on:drop={handleFilesSelect}
              accept=".txt"
              containerClasses="bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg cursor-pointer flex flex-col items-center justify-center p-8 h-48"
              disableDefaultStyles={true}
            >
              {#if file}
                <div class="text-center">
                  <p class="font-medium text-gray-900">{file.name}</p>
                  <p class="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              {:else}
                <div class="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-gray-600 font-medium">Click or drag file to upload</p>
                  <p class="text-sm text-gray-400 mt-1">Only .txt files supported</p>
                </div>
              {/if}
            </Dropzone>
          </div>
        </div>

        {#if parsedChapters.length > 0}
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 class="font-semibold text-blue-900 mb-2">File Preview</h3>
            <p class="text-blue-800 mb-2">Found <span class="font-bold">{parsedChapters.length}</span> chapters.</p>
            <div class="max-h-40 overflow-y-auto text-sm text-blue-700 bg-white rounded border border-blue-100 p-2">
              {#each parsedChapters.slice(0, 10) as chapter}
                <div class="py-1 border-b border-blue-50 last:border-0">
                  Chapter {chapter.number}: {chapter.title}
                </div>
              {/each}
              {#if parsedChapters.length > 10}
                <div class="py-1 text-gray-500 italic">...and {parsedChapters.length - 10} more</div>
              {/if}
            </div>
          </div>
        {/if}

        <textarea class="hidden" name="text" bind:value={text}></textarea>

        <div class="flex justify-end">
          <Button type="submit" disabled={!selectedNovelId || !text || isUploading}>
            {#if isUploading}
              Processing...
            {:else}
              Update / Upload Chapters
            {/if}
          </Button>
        </div>
      </form>
    </div>
  {:else}
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <form
        action="?/create_novel"
        method="POST"
        use:enhance={() => {
          return handleCreateResult
        }}
        class="flex flex-col gap-5"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Novel Title</label>
            <input
              type="text"
              id="name"
              name="name"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. The Great Adventure"
              required
            />
          </div>
          <div>
            <label for="author" class="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. John Doe"
              required
            />
          </div>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter a brief description of the novel..."
            required
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="genre" class="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <input
              type="text"
              id="genre"
              name="genre"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Fantasy, Adventure"
              required
            />
          </div>
          <div>
            <label for="image" class="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://example.com/cover.jpg"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <Button type="submit">Create Novel</Button>
        </div>
      </form>
    </div>
  {/if}
</div>
