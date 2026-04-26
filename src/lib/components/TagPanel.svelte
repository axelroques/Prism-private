<script lang="ts">
  import type { Dimension, PaperMeta } from '../types';

  export let dimensions: Dimension[] = [];
  export let meta: PaperMeta;
  export let onToggleTag: (dimensionId: string, tagId: string) => void;
  export let onAddDimension: (label: string) => void;
  export let onAddTag: (dimensionId: string, label: string) => void;
  export let onDeleteDimension: (dimensionId: string) => void;
  export let onDeleteTag: (dimensionId: string, tagId: string) => void;

  let newDimensionLabel = '';
  let addingDimension = false;
  let addingTagFor: string | null = null;
  let newTagLabel = '';

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
</script>

<section class="bg-charcoal-800 border border-stone-700 rounded-xl p-5 flex flex-col gap-4">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Tags</span>
    <button
      on:click={() => { addingDimension = true; }}
      class="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
    >+ dimension</button>
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
          <span class="text-xs font-bold text-sand-300">{dim.label}</span>
          <div class="flex items-center gap-3">
            <button
              on:click={() => { addingTagFor = dim.id; newTagLabel = ''; }}
              class="text-[11px] font-semibold text-sand-600 hover:text-amber-400 transition-colors cursor-pointer"
            >+ tag</button>
            <button
              on:click={() => onDeleteDimension(dim.id)}
              class="text-[11px] text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
              title="Remove dimension"
            >×</button>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 items-center">
          {#each dim.tags as tag (tag.id)}
            <div class="group relative flex items-center">
              <button
                on:click={() => onToggleTag(dim.id, tag.id)}
                class="text-xs font-semibold pr-6 pl-2.5 py-0.5 rounded-full border transition-colors cursor-pointer
                  {isActive(dim.id, tag.id)
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                    : 'border-stone-600 text-sand-500 hover:border-amber-400/40 hover:text-amber-400'}"
              >{tag.label}</button>
              <button
                on:click|stopPropagation={() => onDeleteTag(dim.id, tag.id)}
                class="absolute right-1.5 text-[10px] text-stone-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                title="Remove tag"
              >×</button>
            </div>
          {/each}

          {#if addingTagFor === dim.id}
            <input
              type="text"
              placeholder="tag name…"
              bind:value={newTagLabel}
              on:keydown={(e) => handleTagKeydown(e, dim.id)}
              class="text-xs bg-charcoal-900 border border-amber-400/40 text-sand-200 placeholder-stone-600 rounded-full px-3 py-0.5 w-28 outline-none focus:border-amber-400"
              autofocus
            />
          {/if}
        </div>

      </div>

      <!-- Divider between dimensions -->
      <div class="border-t border-stone-700/60"></div>
    {/each}

    <!-- Add dimension input -->
    {#if addingDimension}
      <div class="flex items-center gap-2">
        <input
          type="text"
          placeholder="dimension name…"
          bind:value={newDimensionLabel}
          on:keydown={handleDimKeydown}
          class="text-xs bg-charcoal-900 border border-amber-400/40 text-sand-200 placeholder-stone-600 rounded px-3 py-1.5 flex-1 outline-none focus:border-amber-400"
          autofocus
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