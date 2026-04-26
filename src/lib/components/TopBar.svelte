<script lang="ts">
  import type { Session } from '../types';

  export let session: Session | null = null;
  export let onNewSession: () => void;
  export let onOpenSession: (file: File) => void;
  export let onSaveSession: () => void;
  export let onLoadBib: (file: File) => void;

  let bibInput: HTMLInputElement;
  let sessionInput: HTMLInputElement;

  function handleBibChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { onLoadBib(f); bibInput.value = ''; }
  }

  function handleSessionChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { onOpenSession(f); sessionInput.value = ''; }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
</script>

<header class="flex items-center gap-6 px-5 h-12 shrink-0 border-b border-stone-700 bg-charcoal-900 z-50">

  <div class="flex items-center gap-2 shrink-0">
    <span class="text-amber-400 text-base leading-none">◈</span>
    <span class="text-sand-100 font-bold text-xs tracking-widest uppercase">Prism</span>
  </div>

  <div class="flex-1 flex items-center gap-2 text-xs overflow-hidden min-w-0">
    {#if session}
      <span class="text-sand-200 font-semibold truncate">{session.fileName}</span>
      <span class="text-stone-600 shrink-0">·</span>
      <span class="text-sand-600 whitespace-nowrap shrink-0">saved {fmt(session.updatedAt)}</span>
    {:else}
      <span class="text-sand-600 italic">no session loaded</span>
    {/if}
  </div>

  <div class="flex items-center gap-2 shrink-0">
    <button
      on:click={() => bibInput.click()}
      class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-400 hover:bg-charcoal-700 hover:text-sand-200 transition-colors cursor-pointer"
    >Load .bib</button>
    <input bind:this={bibInput} type="file" accept=".bib" on:change={handleBibChange} class="hidden" />

    <button
      on:click={() => sessionInput.click()}
      class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-400 hover:bg-charcoal-700 hover:text-sand-200 transition-colors cursor-pointer"
    >Open session</button>
    <input bind:this={sessionInput} type="file" accept=".json" on:change={handleSessionChange} class="hidden" />

    <button
      on:click={onSaveSession}
      disabled={!session}
      class="px-3 py-1.5 text-xs font-bold rounded bg-amber-500 text-charcoal-900 hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
    >Save</button>

    <button
      on:click={onNewSession}
      class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-600 hover:bg-charcoal-700 hover:text-sand-400 transition-colors cursor-pointer"
    >New</button>
  </div>
</header>