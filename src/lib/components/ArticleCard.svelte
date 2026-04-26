<script lang="ts">
  import type { BibEntry, Dimension, PaperMeta, PaperStatus } from '../types';

  export let entry: BibEntry;
  export let meta: PaperMeta;
  export let dimensions: Dimension[] = [];
  export let onSetStatus: (status: PaperStatus) => void;
  export let onToggleTag: (dimensionId: string, tagId: string) => void;

  $: status = meta?.status ?? 'unsorted';

  const statusStyles: Record<PaperStatus, string> = {
    unsorted:  'bg-charcoal-700 text-sand-500',
    accepted:  'bg-green-900/60 text-green-400',
    rejected:  'bg-red-900/60 text-red-400',
  };

  const statusLabel: Record<PaperStatus, string> = {
    unsorted: 'Unsorted',
    accepted: 'Accepted',
    rejected: 'Rejected',
  };
</script>

<article class="bg-charcoal-800 border border-stone-700 rounded-xl p-5 flex flex-col gap-4">

  <!-- Status row -->
  <div class="flex items-center justify-between gap-3">
    <span class="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full {statusStyles[status]}">
      {statusLabel[status]}
    </span>

    <div class="flex gap-2">
      {#if status !== 'accepted'}
        <button
          on:click={() => onSetStatus('accepted')}
          class="px-3 py-1 text-xs font-bold rounded border border-green-700 text-green-400 hover:bg-green-900/40 transition-colors cursor-pointer"
        >✓ Accept</button>
      {/if}
      {#if status !== 'rejected'}
        <button
          on:click={() => onSetStatus('rejected')}
          class="px-3 py-1 text-xs font-bold rounded border border-red-800 text-red-400 hover:bg-red-900/40 transition-colors cursor-pointer"
        >✕ Reject</button>
      {/if}
      {#if status !== 'unsorted'}
        <button
          on:click={() => onSetStatus('unsorted')}
          class="px-3 py-1 text-xs font-semibold rounded border border-stone-600 text-sand-600 hover:bg-charcoal-700 transition-colors cursor-pointer"
        >↺ Unsort</button>
      {/if}
    </div>
  </div>

  <!-- Title -->
  <h2 class="text-sand-100 font-bold text-base leading-snug">{entry.title ?? 'Untitled'}</h2>

  <!-- Meta -->
  <p class="text-xs text-sand-600 leading-relaxed">
    {#if entry.author}{entry.author}{/if}
    {#if entry.year}<span class="text-sand-400 font-semibold"> · {entry.year}</span>{/if}
    {#if entry.journal}<em> · {entry.journal}</em>{/if}
    {#if entry.booktitle}<em> · {entry.booktitle}</em>{/if}
  </p>

  {#if entry.doi}
    <a
      href="https://doi.org/{entry.doi}"
      target="_blank"
      rel="noopener noreferrer"
      class="text-[11px] text-amber-500 hover:text-amber-400 font-mono transition-colors w-fit"
    >doi:{entry.doi}</a>
  {/if}

  <!-- Abstract -->
  {#if entry.abstract}
    <div class="border-t border-stone-700 pt-4">
      <p class="text-[10px] font-bold uppercase tracking-widest text-sand-600 mb-2">Abstract</p>
      <p class="text-xs text-sand-400 leading-relaxed max-h-48 overflow-y-auto pr-1">{entry.abstract}</p>
    </div>
  {/if}

  <!-- Tags -->
  {#if dimensions.some(d => (meta?.tags?.[d.id] ?? []).length > 0)}
    <div class="border-t border-stone-700 pt-4 flex flex-col gap-2">
      <p class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Tags</p>
      <div class="flex flex-wrap gap-1.5">
        {#each dimensions as dim}
          {#each (meta?.tags?.[dim.id] ?? []) as tagId}
            {@const tag = dim.tags.find(t => t.id === tagId)}
            {#if tag}
              <button
                on:click={() => onToggleTag(dim.id, tagId)}
                class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer"
                style="border-color: {dim.color}; background-color: {dim.color}; color: #1c1a16;"
                on:mouseenter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = dim.color; }}
                on:mouseleave={(e) => { e.currentTarget.style.backgroundColor = dim.color; e.currentTarget.style.color = '#1c1a16'; }}
              >#{tag.label}</button>
            {/if}
          {/each}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Keywords -->
  {#if entry.keywords}
    <div class="flex flex-wrap gap-1.5 border-t border-stone-700 pt-4">
      {#each entry.keywords.split(/[,;]/).map(k => k.trim()).filter(Boolean) as kw}
        <span class="text-[10px] bg-charcoal-700 text-sand-500 rounded px-2 py-0.5">{kw}</span>
      {/each}
    </div>
  {/if}

</article>