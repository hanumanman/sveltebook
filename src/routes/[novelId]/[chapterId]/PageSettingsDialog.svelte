<script lang="ts">
  import Button from '$lib/components/Button.svelte';

  import { pageSettingsStore, themes } from './pageSettingsStore';

  interface Props {
    open: boolean;
    toggleDialogFn: () => void;
  }

  let { open, toggleDialogFn }: Props = $props();

  //Convert themes to an array
  const themesArray = Object.entries(themes).map(([key, value]) => ({
    key,
    value
  }));
</script>

<!-- NOTE: This component must be placed at the top of the page -->
<dialog {open} class="fixed h-[100dvh] w-[100dvw] bg-transparent">
  <div class="grid h-full w-full place-items-center">
    <div
      class="bg-pennBlue-900 flex flex-col max-w-[100dvw] md:max-w-xl items-center justify-center gap-4 rounded-lg border-2 border-gray-400 p-4 text-gray-300 md:p-6"
    >
      <div class="w-full">
        <h2>Font size</h2>
        <div class="flex gap-2">
          <input
            type="range"
            class="grow"
            bind:value={$pageSettingsStore.fontSize}
            min="12"
            max="24"
            step="0.1"
          />
          <p>{$pageSettingsStore.fontSize} px</p>
        </div>
      </div>
      <div class="w-full">
        <h2>Line height</h2>
        <div class="flex w-full gap-2">
          <input
            type="range"
            class="grow"
            bind:value={$pageSettingsStore.lineHeight}
            min="0"
            max="5"
            step="0.1"
          />
          <p>{$pageSettingsStore.lineHeight}</p>
        </div>
      </div>
      <div class="w-full">
        <h2>Theme</h2>
        <div class="flex pb-2 gap-2 justify-between overflow-x-scroll">
          {#each themesArray as { key, value }, i (i)}
            <Button
              class="w-20 flex aspect-square"
              style="color:{value.color}; background-color:{value.background};"
              onclick={() => {
                $pageSettingsStore.theme = key as keyof typeof themes;
              }}
            >
              A
            </Button>
          {/each}
        </div>
      </div>

      <div
        style="font-size: {$pageSettingsStore.fontSize}px; line-height: {$pageSettingsStore.lineHeight};background-color: {themes[
          $pageSettingsStore.theme
        ].background}; color: {themes[$pageSettingsStore.theme].color};"
        class="p-4 rounded-lg"
      >
        <p class="line-clamp-3">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam, consectetur sunt, aliquam
          corrupti cupiditate doloremque, ipsum suscipit adipisci maxime itaque beatae quae delectus
          inventore nihil. Veniam ut nostrum voluptates eaque.
        </p>
      </div>
      <div class="flex gap-2">
        <Button onclick={toggleDialogFn}>Save</Button>
        <Button
          onclick={() => {
            $pageSettingsStore = {
              fontSize: 16,
              lineHeight: 1.5,
              theme: 'default'
            };
          }}>Reset</Button
        >
      </div>
    </div>
  </div>
</dialog>
