<script lang="ts">
  import type { Dimension, PaperMeta } from '../types';

  export let dimensions: Dimension[] = [];
  export let meta: PaperMeta;
  export let onToggleTag: (dimensionId: string, tagId: string) => void;
  export let onAddDimension: (label: string) => void;
  export let onAddTag: (dimensionId: string, label: string) => void;
  export let onUpdateDimensionColor: (dimId: string, color: string) => void;
  export let onDeleteDimension: (dimensionId: string) => void;
  export let onDeleteTag: (dimensionId: string, tagId: string) => void;

  let newDimensionLabel = '';
  let addingDimension = false;
  let addingTagFor: string | null = null;
  let newTagLabel = '';
  let confirmDelete: { type: 'dimension' | 'tag', dimId: string, tagId?: string } | null = null;

  function focus(el: HTMLElement) { el.focus(); }

  function isActive(dimId: string, tagId: string): boolean {
    return meta?.tags?.[dimId]?.includes(tagId) ?? false;
  }

  function submitDimension() {
    const label = newDimensionLabel.trim();
    if (!label) return;
    onAddDimension(label);
    newDimensionLabel = '';
    addingDimension = false;
  }

  function submitTag(dimId: string) {
    const label = newTagLabel.trim();
    if (!label) return;
    onAddTag(dimId, label);
    newTagLabel = '';
    addingTagFor = null;
  }

  function handleDimKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submitDimension();
    if (e.key === 'Escape') { addingDimension = false; newDimensionLabel = ''; }
  }

  function handleTagKeydown(e: KeyboardEvent, dimId: string) {
    if (e.key === 'Enter') submitTag(dimId);
    if (e.key === 'Escape') { addingTagFor = null; newTagLabel = ''; }
  }

  function requestDeleteDimension(dimId: string) {
    confirmDelete = { type: 'dimension', dimId };
  }

  function requestDeleteTag(dimId: string, tagId: string) {
    confirmDelete = { type: 'tag', dimId, tagId };
  }

  function confirmDeleteAction() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'dimension') {
      onDeleteDimension(confirmDelete.dimId);
    } else if (confirmDelete.tagId) {
      onDeleteTag(confirmDelete.dimId, confirmDelete.tagId);
    }
    confirmDelete = null;
  }
</script>

<section class="bg-charcoal-800 border border-stone-700 rounded-xl p-5 flex flex-col gap-4">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <span class="text-xs font-bold uppercase tracking-widest text-sand-600">@Dimensions & #Tags</span>
    <button
      on:click={() => { addingDimension = true; }}
      class="text-xs font-semibold text-amber-500 border border-amber-500 rounded px-2 py-1 hover:bg-amber-500 hover:!text-[#1c1a16] transition-colors cursor-pointer"
    >+ @Dimension</button>
  </div>

  {#if dimensions.length === 0 && !addingDimension}
    <p class="text-xs text-sand-600 italic">No dimensions yet. Add one to start tagging.</p>
  {/if}

  <!-- Dimensions -->
  <div class="flex flex-col gap-4">
    {#each dimensions as dim (dim.id)}
      <div class="flex flex-col gap-2">

        <!-- Dimension header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Color picker -->
            <input
              type="color"
              value={dim.color}
              on:change={(e) => onUpdateDimensionColor(dim.id, e.currentTarget.value)}
              class="w-4 h-4 rounded-full cursor-pointer border-0 bg-transparent p-0"
              title="Change dimension color"
            />
            <span class="text-xs font-bold text-sand-300">@{dim.label}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              on:click={() => { addingTagFor = dim.id; newTagLabel = ''; }}
              class="text-[11px] font-semibold border rounded px-1.5 py-0.5 transition-colors cursor-pointer"
              style="color: {dim.color}; border-color: {dim.color};"
              on:mouseenter={(e) => { e.currentTarget.style.backgroundColor = dim.color; e.currentTarget.style.color = '#1c1a16'; }}
              on:mouseleave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = dim.color; }}
            >+ #Tag</button>
            <button
              on:click={() => requestDeleteDimension(dim.id)}
              class="text-[11px] text-stone-600 hover:text-red-400 transition-colors cursor-pointer px-1"
              title="Delete dimension"
            >⋯</button>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 items-center">
          {#each dim.tags as tag (tag.id)}
            <div class="group relative flex items-center gap-1">
              <button
                on:click={() => onToggleTag(dim.id, tag.id)}
                class="text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer"
                style="border-color: {dim.color}; background-color: {isActive(dim.id, tag.id) ? dim.color : 'transparent'}; color: {isActive(dim.id, tag.id) ? '#1c1a16' : dim.color};"
                on:mouseenter={(e) => { e.currentTarget.style.backgroundColor = dim.color; e.currentTarget.style.color = '#1c1a16'; }}
                on:mouseleave={(e) => { e.currentTarget.style.backgroundColor = isActive(dim.id, tag.id) ? dim.color : 'transparent'; e.currentTarget.style.color = isActive(dim.id, tag.id) ? '#1c1a16' : dim.color; }}
              >#{tag.label}</button>
              <button
                on:click={() => requestDeleteTag(dim.id, tag.id)}
                class="text-[10px] text-stone-700 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 ml-0.5"
                title="Delete tag"
              >×</button>
            </div>
          {/each}

          {#if addingTagFor === dim.id}
            <input
              use:focus
              type="text"
              placeholder="#tag name…"
              bind:value={newTagLabel}
              on:keydown={(e) => handleTagKeydown(e, dim.id)}
              class="text-xs bg-charcoal-900 border border-amber-400/40 text-sand-200 placeholder-stone-600 rounded-full px-3 py-0.5 w-28 outline-none focus:border-amber-400"
            />
          {/if}
        </div>
      </div>
      <div class="border-t border-stone-700/60"></div>
    {/each}

    <!-- Add dimension input -->
    {#if addingDimension}
      <div class="flex items-center gap-2">
        <input
          use:focus
          type="text"
          placeholder="@NewDimension"
          bind:value={newDimensionLabel}
          on:keydown={handleDimKeydown}
          class="text-xs bg-charcoal-900 border border-amber-400/40 text-sand-200 placeholder-stone-600 rounded px-3 py-1.5 flex-1 outline-none focus:border-amber-400"
        />
        <button
          on:click={submitDimension}
          class="text-xs font-bold px-3 py-1.5 rounded border border-amber-400/60 text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
        >Add</button>
        <button
          on:click={() => { addingDimension = false; newDimensionLabel = ''; }}
          class="text-xs font-semibold px-3 py-1.5 rounded border border-stone-600 text-sand-600 hover:bg-charcoal-700 transition-colors cursor-pointer"
        >Cancel</button>
      </div>
    {/if}
  </div>

</section>

{#if confirmDelete}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div class="bg-charcoal-800 border border-stone-700 rounded-xl p-6 flex flex-col gap-4 w-72">
      <p class="text-sm font-semibold text-sand-100">
        {#if confirmDelete.type === 'dimension'}
          Delete this dimension and all its tags?
        {:else}
          Delete this tag?
        {/if}
      </p>
      <p class="text-xs text-sand-600">This will also remove it from all papers in the session.</p>
      <div class="flex gap-2 justify-end">
        <button
          on:click={() => confirmDelete = null}
          class="px-3 py-1.5 text-xs font-semibold rounded border border-stone-600 text-sand-600 hover:bg-charcoal-700 cursor-pointer"
        >Cancel</button>
        <button
          on:click={confirmDeleteAction}
          class="px-3 py-1.5 text-xs font-bold rounded bg-red-900/60 border border-red-800 text-red-400 hover:bg-red-900 cursor-pointer"
        >Delete</button>
      </div>
    </div>
  </div>
{/if}