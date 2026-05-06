<script lang="ts">
  import type { Session } from '../../types';
  import GraphView from './GraphView.svelte';
  import BarChartView from './BarChartView.svelte';
  import HeatmapView from './HeatmapView.svelte';

  export let session: Session;
  export let onSelectPaper: (id: string) => void;

  type AnalysisView = 'graph' | 'bar' | 'heatmap';
  let activeView: AnalysisView = 'graph';

  // Filter state — independent of Review tab
  let enabledDimIds: string[] = session.dimensions.map(d => d.id);
  let enabledTagIds: string[] = session.dimensions.flatMap(d => d.tags.map(t => t.id));

  // Sync when session dimensions change
  $: syncDimensions(session.dimensions);

  function syncDimensions(dimensions: typeof session.dimensions) {
    const allDimIds = dimensions.map(d => d.id);
    const allTagIds = dimensions.flatMap(d => d.tags.map(t => t.id));
    const newDims = allDimIds.filter(id => !enabledDimIds.includes(id));
    const newTags = allTagIds.filter(id => !enabledTagIds.includes(id));
    enabledDimIds = [...enabledDimIds.filter(id => allDimIds.includes(id)), ...newDims];
    enabledTagIds = [...enabledTagIds.filter(id => allTagIds.includes(id)), ...newTags];
  }

  function toggleDim(dimId: string) {
    const dim = session.dimensions.find(d => d.id === dimId);
    if (!dim) return;
    if (enabledDimIds.includes(dimId)) {
      enabledDimIds = enabledDimIds.filter(id => id !== dimId);
      enabledTagIds = enabledTagIds.filter(id => !dim.tags.some(t => t.id === id));
    } else {
      enabledDimIds = [...enabledDimIds, dimId];
      enabledTagIds = [...enabledTagIds, ...dim.tags.map(t => t.id)];
    }
  }

  function toggleTag(dimId: string, tagId: string) {
    if (enabledTagIds.includes(tagId)) {
      enabledTagIds = enabledTagIds.filter(id => id !== tagId);
    } else {
      enabledTagIds = [...enabledTagIds, tagId];
      if (!enabledDimIds.includes(dimId)) {
        enabledDimIds = [...enabledDimIds, dimId];
      }
    }
  }
</script>

<div class="flex flex-col h-full overflow-hidden bg-charcoal-950">

  <!-- Toolbar -->
  <div class="flex items-center gap-4 px-4 py-2.5 border-b border-stone-700 bg-charcoal-900 shrink-0">

    <!-- View switcher icons -->
    <div class="flex items-center gap-1.5">

      <!-- Graph -->
      <button
        on:click={() => activeView = 'graph'}
        title="Force graph"
        class="p-1.5 rounded border transition-colors cursor-pointer
          {activeView === 'graph'
            ? 'bg-amber-500 border-amber-500 text-charcoal-900'
            : 'border-stone-600 text-sand-600 hover:border-amber-400 hover:text-amber-400'}"
      >
        <!-- Heroicon: share (graph) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      <!-- Bar chart -->
      <button
        on:click={() => activeView = 'bar'}
        title="Tag frequency"
        class="p-1.5 rounded border transition-colors cursor-pointer
          {activeView === 'bar'
            ? 'bg-amber-500 border-amber-500 text-charcoal-900'
            : 'border-stone-600 text-sand-600 hover:border-amber-400 hover:text-amber-400'}"
      >
        <!-- Heroicon: chart-bar -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      <!-- Heatmap -->
      <button
        on:click={() => activeView = 'heatmap'}
        title="Co-occurrence heatmap"
        class="p-1.5 rounded border transition-colors cursor-pointer
          {activeView === 'heatmap'
            ? 'bg-amber-500 border-amber-500 text-charcoal-900'
            : 'border-stone-600 text-sand-600 hover:border-amber-400 hover:text-amber-400'}"
      >
        <!-- Heroicon: table-cells -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
        </svg>
      </button>

    </div>

    <!-- Divider -->
    <div class="w-px h-5 bg-stone-700 shrink-0"></div>

    <!-- Filter pills -->
    <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
      {#each session.dimensions as dim}
        <div class="flex items-center gap-1">
          <!-- Dimension toggle -->
          <button
            on:click={() => toggleDim(dim.id)}
            class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer"
            style="border-color: {dim.color}; background-color: {enabledDimIds.includes(dim.id) ? dim.color + '33' : 'transparent'}; color: {enabledDimIds.includes(dim.id) ? dim.color : dim.color + '55'};"
            on:mouseenter={(e) => { e.currentTarget.style.backgroundColor = dim.color + '44'; }}
            on:mouseleave={(e) => { e.currentTarget.style.backgroundColor = enabledDimIds.includes(dim.id) ? dim.color + '33' : 'transparent'; }}
          >@{dim.label}</button>

          <!-- Individual tag toggles -->
          {#each dim.tags as tag}
            <button
              on:click={() => toggleTag(dim.id, tag.id)}
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer"
              style="border-color: {dim.color}; background-color: {enabledTagIds.includes(tag.id) ? dim.color + '22' : 'transparent'}; color: {enabledTagIds.includes(tag.id) ? dim.color : dim.color + '44'};"
              on:mouseenter={(e) => { e.currentTarget.style.backgroundColor = dim.color + '33'; }}
              on:mouseleave={(e) => { e.currentTarget.style.backgroundColor = enabledTagIds.includes(tag.id) ? dim.color + '22' : 'transparent'; }}
            >#{tag.label}</button>
          {/each}
        </div>
      {/each}
    </div>

  </div>

  <!-- View area -->
  <div class="flex-1 overflow-hidden">
    {#if activeView === 'graph'}
      <GraphView
        {session}
        enabledDimIds={enabledDimIds}
        enabledTagIds={enabledTagIds}
        {onSelectPaper}
      />
    {:else if activeView === 'bar'}
      <BarChartView
        {session}
        enabledDimIds={enabledDimIds}
        enabledTagIds={enabledTagIds}
      />
    {:else if activeView === 'heatmap'}
      <HeatmapView
        {session}
        enabledDimIds={enabledDimIds}
        enabledTagIds={enabledTagIds}
      />
    {/if}
  </div>

</div>