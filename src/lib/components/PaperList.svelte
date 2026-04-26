<script lang="ts">
  import type { BibEntry, Dimension, PaperMeta, Tag } from '../types';

  export let entries: BibEntry[] = [];
  export let papers: Record<string, PaperMeta> = {};
  export let dimensions: Dimension[] = [];
  export let selectedId: string | null = null;
  export let onSelect: (id: string) => void;
  export let onDisplayedChange: (ids: string[]) => void = () => {};
  export let onExportBib: (entries: BibEntry[]) => void;
  export let onExportCsv: (entries: BibEntry[]) => void;

  type Tab = 'unsorted' | 'accepted' | 'rejected';
  type SortField = 'year' | 'title';
  type SortOrder = 'asc' | 'desc';

  export let defaultTab: Tab = 'unsorted';
  
  let activeTab: Tab = defaultTab;
  let sortField: SortField = 'year';
  let sortOrder: SortOrder = 'asc';
  let displayed: BibEntry[] = [];

  function getActiveTags(entryId: string): { tag: Tag; color: string }[] {
    return dimensions.flatMap(dim =>
      (papers[entryId]?.tags?.[dim.id] ?? [])
        .map(tagId => dim.tags.find(t => t.id === tagId))
        .filter((t): t is Tag => t !== undefined)
        .map(t => ({ tag: t, color: dim.color }))
    );
  }

  $: grouped = {
    unsorted: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'unsorted'),
    accepted: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'accepted'),
    rejected: entries.filter(e => (papers[e.id]?.status ?? 'unsorted') === 'rejected'),
  };


  let search = '';
  function filterEntries(entries: BibEntry[], _search: string, _papers: Record<string, PaperMeta>, _dimensions: Dimension[]): BibEntry[] {
    const q = search.trim().toLowerCase();
    if (!q) return entries;

    // Dimension search: @dimensionname
    if (q.startsWith('@')) {
      const dimQuery = q.slice(1).trim();
      // bare "@" — show all papers that have at least one tag in any dimension
      if (!dimQuery) {
        return entries.filter(e =>
          _dimensions.some(dim => (_papers[e.id]?.tags?.[dim.id] ?? []).length > 0)
        );
      }
      // "@something" — filter to matching dimensions
      const matchingDims = _dimensions.filter(d =>
        d.label.toLowerCase().includes(dimQuery)
      );
      if (matchingDims.length === 0) return [];
      return entries.filter(e =>
        matchingDims.some(dim => (_papers[e.id]?.tags?.[dim.id] ?? []).length > 0)
      );
    }

    // Tag search: #tagname
    if (q.startsWith('#')) {
      const tagQuery = q.slice(1);
      return entries.filter(e => {
        return dimensions.some(dim => {
          const activeTags = papers[e.id]?.tags?.[dim.id] ?? [];
          return activeTags.some(tagId => {
            const tag = dim.tags.find(t => t.id === tagId);
            return tag?.label.toLowerCase().includes(tagQuery);
          });
        });
      });
    }

    // Field search: field:value (e.g. author:smith, year:2023)
    const fieldMatch = q.match(/^(\w+):(.+)$/);
    if (fieldMatch) {
      const [, field, value] = fieldMatch;
      return entries.filter(e =>
        e[field]?.toLowerCase().includes(value.trim())
      );
    }

    // Default: title search
    return entries.filter(e =>
      (e.title ?? '').toLowerCase().includes(q)
    );
  }

  function sortEntries(entries: BibEntry[], _sortField: SortField, _sortOrder: SortOrder): BibEntry[] {
    return [...entries].sort((a, b) => {
      let valA: string, valB: string;
      if (sortField === 'year') {
        valA = a.year ?? '';
        valB = b.year ?? '';
      } else {
        valA = (a.title ?? '').toLowerCase();
        valB = (b.title ?? '').toLowerCase();
      }
      const cmp = valA.localeCompare(valB);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  $: {
    displayed = sortEntries(filterEntries(grouped[activeTab], search, papers, dimensions), sortField, sortOrder);
    onDisplayedChange(displayed.map(e => e.id));
  }

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

  <!-- Search bar -->
  <div class="px-2 py-2 border-b border-stone-700 shrink-0 flex items-center gap-1.5">
    <input
      type="text"
      bind:value={search}
      placeholder="Title, field:value, @dimension, #tag"
      class="flex-1 min-w-0 text-xs bg-charcoal-900 border border-stone-700 text-sand-200 placeholder-stone-600 rounded px-3 py-1.5 outline-none focus:border-amber-400/60"
    />

    <!-- Sort field toggle: year / title -->
    <button
      on:click={() => { sortField = sortField === 'year' ? 'title' : 'year'; }}
      title={sortField === 'year' ? 'Sorting by year' : 'Sorting by title'}
      class="shrink-0 p-1.5 rounded border border-stone-700 text-stone-600 hover:text-amber-400 hover:border-amber-400 transition-colors cursor-pointer"
    >
      {#if sortField === 'year'}
        <!-- Calendar icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      {:else}
        <!-- Text icon -->
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
        </svg>
      {/if}
    </button>

    <!-- Sort order toggle: asc / desc -->
    <button
      on:click={() => { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; }}
      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      class="shrink-0 p-1.5 rounded border border-stone-700 text-stone-600 hover:text-amber-400 hover:border-amber-400 transition-colors cursor-pointer"
    >
      {#if sortOrder === 'asc'}
        <!-- Heroicon: bars-arrow-up -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
      {:else}
        <!-- Heroicon: bars-arrow-down -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h9m5 4V8m0 0l-4 4m4-4l4 4" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- Export bar -->
  <div class="px-3 py-1.5 border-b border-stone-700 shrink-0 flex items-center justify-between">
    <span class="text-[11px] text-stone-400 font-semibold">
      {displayed.length} paper{displayed.length === 1 ? '' : 's'}
    </span>

    <div class="flex items-center gap-1.5">
      <button
        on:click={() => onExportBib(displayed)}
        title="Export as .bib"
        class="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-400 transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        .bib
      </button>

      <button
        on:click={() => onExportCsv(displayed)}
        title="Export as .csv"
        class="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-400 transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        .csv
      </button>
    </div>
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
          <!-- Add tags -->
          {#if getActiveTags(entry.id).length > 0}
            <div class="flex flex-wrap gap-1 mt-1.5">
              {#each getActiveTags(entry.id) as { tag, color }}
                <span
                  style="border-color: {color}; background-color: {color}; color: #1c1a16;"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-full border leading-none"
                >#{tag.label}</span>
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    {/if}
  </div>
</aside>