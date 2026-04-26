<script lang="ts">
  import type { Session } from '../types';

  export let session: Session | null = null;
  export let dirty: boolean = false;
  export let onNewSession: () => void;
  export let onOpenSession: (file: File) => void;
  export let onSaveSession: () => void;
  export let onAddBib: (file: File) => void;

  let bibInput: HTMLInputElement;
  let sessionInput: HTMLInputElement;

  function handleBibChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { onAddBib(f); bibInput.value = ''; }
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

<header class="flex items-center gap-4 px-5 h-12 shrink-0 border-b border-stone-700 bg-charcoal-900 z-50">

  <!-- Logo -->
  <div class="flex items-center gap-2 shrink-0">
    <span class="text-amber-400 text-base leading-none">◈</span>
    <span class="text-sand-100 font-bold text-xs tracking-widest uppercase">Prism</span>
  </div>

  <!-- Divider -->
  <div class="w-px h-5 bg-stone-700 shrink-0"></div>

  <!-- Session info -->
  <div class="flex-1 flex items-center gap-2.5 text-xs overflow-hidden min-w-0">
    {#if session}
      <span class="text-sand-200 font-bold truncate">{session.name}</span>
      <span class="text-stone-600 shrink-0">·</span>
      <span class="text-sand-600 shrink-0 whitespace-nowrap">
        {session.entries.length} paper{session.entries.length === 1 ? '' : 's'}
      </span>
      <span class="text-stone-600 shrink-0">·</span>
      <span class="text-sand-600 shrink-0 whitespace-nowrap">saved {fmt(session.updatedAt)}</span>
    {:else}
      <span class="text-sand-600 italic">no session loaded</span>
    {/if}
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-2 shrink-0">

    <!-- Add .bib — only when session is open -->
    {#if session}
      <button
        on:click={() => bibInput.click()}
        class="px-3 py-1.5 text-xs font-semibold rounded border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-[#1c1a16] transition-colors cursor-pointer"
      >+ .bib</button>
      <input bind:this={bibInput} type="file" accept=".bib" on:change={handleBibChange} class="hidden" />
    {/if}

    <!-- New session -->
    <button
      on:click={onNewSession}
      class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-600 hover:bg-amber-400 hover:text-[#1c1a16] transition-colors cursor-pointer"
    >New</button>

    <!-- Open session -->
    <button
      on:click={() => sessionInput.click()}
      class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-400 hover:bg-amber-400 hover:text-[#1c1a16] transition-colors cursor-pointer"
    >Open</button>
    <input bind:this={sessionInput} type="file" accept=".json" on:change={handleSessionChange} class="hidden" />

    <!-- Save — with dirty indicator -->
    <div class="relative">
      <button
        on:click={onSaveSession}
        disabled={!session}
        title={dirty ? 'Unsaved changes' : 'Up to date'}
        class="px-3 py-1.5 text-xs font-bold rounded border border-stone-600 text-charcoal-900 hover:bg-amber-400 hover:text-[#1c1a16] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
      >Save</button>
      {#if dirty && session}
        <span
          class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 pointer-events-none"
          title="Unsaved changes"
        ></span>
      {/if}
    </div>

  </div>
</header>