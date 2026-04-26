<script lang="ts">
  import type { Template } from '../types';
  import { readTemplateFile } from '../session';

  export let onConfirm: (name: string, template?: Template) => void;
  export let onCancel: () => void;

  let sessionName = '';
  let template: Template | null = null;
  let templateFileName = '';
  let templateError = '';
  let templateInput: HTMLInputElement;

  function focus(el: HTMLElement) { el.focus(); }

  async function handleTemplateChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    templateError = '';
    try {
      template = await readTemplateFile(file);
      templateFileName = file.name;
    } catch {
      templateError = 'Could not read template file.';
      template = null;
      templateFileName = '';
    }
  }

  function handleConfirm() {
    const name = sessionName.trim();
    if (!name) return;
    onConfirm(name, template ?? undefined);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 bg-black/70 bg-blue flex items-center justify-center z-50"
  on:click|self={onCancel}
  on:keydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="bg-[#26231d] border border-stone-700 rounded-xl p-6 flex flex-col gap-5 w-96 shadow-2xl">

    <!-- Title -->
    <h2 class="text-sand-100 font-bold text-base tracking-wide">New session</h2>

    <!-- Session name -->
    <div class="flex flex-col gap-1.5">
      <p class="text-[11px] font-bold uppercase tracking-widest text-sand-600">
        Session name
      </p>
      <input
        use:focus
        type="text"
        bind:value={sessionName}
        placeholder="e.g. ML in Healthcare Review"
        on:keydown={handleKeydown}
        class="text-sm bg-charcoal-900 border border-stone-700 text-sand-200 placeholder-stone-600 rounded-lg px-3 py-2 outline-none focus:border-amber-400/60"
      />
    </div>

    <!-- Template upload -->
    <div class="flex flex-col gap-1.5">
      <p class="text-[11px] font-bold uppercase tracking-widest text-sand-600">
        Template <span class="normal-case font-normal text-stone-600">(optional)</span>
      </p>
      <div class="flex items-center gap-2">
        <button
          on:click={() => templateInput.click()}
          class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-400 hover:bg-charcoal-700 hover:text-sand-200 transition-colors cursor-pointer"
        >
          {template ? 'Change template' : 'Upload template'}
        </button>
        {#if templateFileName}
          <span class="text-xs text-sand-600 truncate">{templateFileName}</span>
          <button
            on:click={() => { template = null; templateFileName = ''; templateInput.value = ''; }}
            class="text-stone-600 hover:text-red-400 transition-colors cursor-pointer text-sm leading-none"
          >×</button>
        {/if}
      </div>
      <input
        bind:this={templateInput}
        type="file"
        accept=".json"
        on:change={handleTemplateChange}
        class="hidden"
      />
      {#if template}
        <p class="text-[11px] text-sand-600">
          {template.dimensions.length} dimension{template.dimensions.length === 1 ? '' : 's'} loaded
        </p>
      {/if}
      {#if templateError}
        <p class="text-[11px] text-red-400">{templateError}</p>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-1">
      <button
        on:click={onCancel}
        class="px-4 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-600 hover:bg-charcoal-700 transition-colors cursor-pointer"
      >Cancel</button>
      <button
        on:click={handleConfirm}
        disabled={!sessionName.trim()}
        class="px-4 py-1.5 text-xs font-bold rounded bg-amber-500 text-charcoal-900 hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
      >Create</button>
    </div>

  </div>
</div>