<script lang="ts">
  import type { BibEntry, PaperMeta, PaperStatus } from '../types';

  export let entries: BibEntry[] = [];
  export let papers: Record<string, PaperMeta> = {};
  export let selectedId: string | null = null;
  export let onSelect: (id: string) => void;

  type Tab = 'unsorted' | 'accepted' | 'rejected';
  export let defaultTab: Tab = 'unsorted';
  let activeTab: Tab = defaultTab;

  $: grouped = {
    unsorted: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'unsorted'),
    accepted: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'accepted'),
    rejected: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'rejected'),
  };

  $: displayed = grouped[activeTab];

  function shortAuthor(author: string): string {
    if (!author) return 'Unknown';
    const first = author.split(/\sand\s|,/)[0].trim();
    const surname = first.split(',')[0]?.trim() ?? first;
    const total = (author.match(/\sand\s/g) ?? []).length + 1;
    return total > 1 ? `${surname} et al.` : surname;
  }

  const tabs: Tab[] = ['unsorted', 'accepted', 'rejected'];
</script>

<aside class="flex flex-col h-full overflow-hidden border-r border-stone-700 bg-charcoal-900">

  <!-- Tabs -->
  <div class="flex shrink-0 border-b border-stone-700">
    {#each tabs as tab}
      <button
        on:click={() => activeTab = tab}
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors cursor-pointer
          {activeTab === tab
            ? 'text-amber-400 border-amber-400'
            : 'text-sand-600 border-transparent hover:text-sand-400'}"
      >
        {tab}
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full
          {activeTab === tab
            ? 'bg-amber-400/20 text-amber-400'
            : 'bg-charcoal-700 text-sand-600'}">
          {grouped[tab].length}
        </span>
      </button>
    {/each}
  </div>

  <!-- List -->
  <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
    {#if displayed.length === 0}
      <p class="text-sand-600 text-xs italic text-center mt-8">No {activeTab} papers.</p>
    {:else}
      {#each displayed as entry (entry.id)}
        <button
          on:click={() => onSelect(entry.id)}
          class="w-full text-left rounded-lg px-3 py-2.5 border transition-colors cursor-pointer
            {selectedId === entry.id
              ? 'bg-amber-400/10 border-amber-400/40'
              : 'bg-transparent border-transparent hover:bg-charcoal-800 hover:border-stone-700'}"
        >
          <p class="text-xs font-semibold text-sand-100 leading-snug line-clamp-2 mb-1">
            {entry.title ?? 'Untitled'}
          </p>
          <p class="text-[10px] text-sand-600 truncate">
            {shortAuthor(entry.author ?? '')}
            {#if entry.year} · {entry.year}{/if}
            {#if entry.journal} · {entry.journal}{/if}
            {#if entry.booktitle} · {entry.booktitle}{/if}
          </p>
        </button>
      {/each}
    {/if}
  </div>
</aside>