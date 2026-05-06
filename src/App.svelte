<script lang="ts">
  import './app.css';
  import { onMount, onDestroy } from 'svelte';
  import TopBar from './lib/components/TopBar.svelte';
  import TagPanel from './lib/components/TagPanel.svelte';
  import PaperList from './lib/components/PaperList.svelte';
  import ArticleCard from './lib/components/ArticleCard.svelte';
  import NewSessionModal from './lib/components/NewSessionModal.svelte';
  import AnalysisPanel from './lib/components/analysis/AnalysisPanel.svelte';

  import type { BibEntry, PaperMeta, PaperStatus, Session, Template } from './lib/types';
  import { exportBib, exportCsv, downloadFile } from './lib/exporter';
  import { parseBib } from './lib/parser';
  import {
    makeEmptySession, makeSessionFromTemplate,
    readSessionFile, saveSessionFile,
  } from './lib/session';

  // ── State ──────────────────────────────────────────────────────────────────
  let activeView: 'review' | 'analysis' = 'review';
  // let entries: BibEntry[] = [];
  let session: Session | null = null;
  let selectedId: string | null = null;
  let displayedIds: string[] = [];
  let dirty = false;
  let showNewSessionModal = false;

  // ── Derived ────────────────────────────────────────────────────────────────
  $: entries = session?.entries ?? [];
  $: selectedEntry  = entries.find(e => e.id === selectedId) ?? null;
  $: selectedMeta   = (selectedId && session?.papers[selectedId]) || null;

  // Auto-select first paper when displayedIds populates and nothing selected
  $: if (displayedIds.length > 0 && selectedId === null) {
    selectedId = displayedIds[0];
  }

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  function markDirty() { dirty = true; }

  // ── beforeunload ───────────────────────────────────────────────────────────
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  }

  onMount(() => window.addEventListener('beforeunload', handleBeforeUnload));
  onDestroy(() => window.removeEventListener('beforeunload', handleBeforeUnload));

  // ── Helpers ────────────────────────────────────────────────────────────────
  function ensureMeta(id: string): PaperMeta {
    if (!session!.papers[id]) {
      session!.papers[id] = { status: 'unsorted', tags: {} };
    }
    return session!.papers[id];
  }

  // ── Session management ─────────────────────────────────────────────────────
  function handleNewSession() {
    if (dirty && !confirm('You have unsaved changes. Start a new session anyway?')) return;
    showNewSessionModal = true;
  }

  function handleCreateSession(name: string, template?: Template) {
    session = template
      ? makeSessionFromTemplate(name, template)
      : makeEmptySession(name);
    selectedId = null;
    dirty = false;
    showNewSessionModal = false;
    activeView = 'review';
  }

  async function handleOpenSession(file: File) {
    if (dirty && !confirm('You have unsaved changes. Open a different session anyway?')) return;
    try {
      session = await readSessionFile(file);
      selectedId = null;
      dirty = false;
      activeView = 'review';
    } catch {
      alert('Could not load session file. Make sure it is a valid Prism session.');
    }
  }

  function handleSaveSession() {
    if (!session) return;
    saveSessionFile(session);
    dirty = false;
  }

  // ── Add .bib ───────────────────────────────────────────────────────────────
  async function handleAddBib(file: File) {
    if (!session) return;
    const text = await file.text();
    const parsed = parseBib(text);
    const existingIds = new Set(session.entries.map(e => e.id));
    const newEntries = parsed.filter(e => !existingIds.has(e.id));
    session.entries = [...session.entries, ...newEntries];
    session = session;
    markDirty();
  }

  // ── Review actions ─────────────────────────────────────────────────────────
  function setStatus(status: PaperStatus) {
    if (!selectedId || !session) return;
    ensureMeta(selectedId).status = status;
    session = session;
    markDirty();
    
    // Find the next entry
    const currentIndex = displayedIds.indexOf(selectedId);
    selectedId = displayedIds[currentIndex + 1] ?? displayedIds[currentIndex - 1] ?? null;
  }

  // ── Dimension / tag actions ────────────────────────────────────────────────────────────
  const PALETTE = ['#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee'];
  function addDimension(label: string) {
    if (!session) return;
    const color = PALETTE[session.dimensions.length % PALETTE.length];
    session.dimensions = [...session.dimensions, { id: crypto.randomUUID(), label, color, tags: [], }];
    markDirty();
  }

  function updateDimensionColor(dimId: string, color: string) {
    if (!session) return;
    session.dimensions = session.dimensions.map(d => d.id === dimId ? { ...d, color } : d );
    session = session;
    markDirty();
  }

  function deleteDimension(dimId: string) {
    if (!session) return;
    session.dimensions = session.dimensions.filter(d => d.id !== dimId);
    for (const meta of Object.values(session.papers)) delete meta.tags[dimId];
    session = session;
    markDirty();
  }

  function addTag(dimId: string, label: string) {
    if (!session) return;
    const tagId = crypto.randomUUID();
    session.dimensions = session.dimensions.map(d =>
      d.id === dimId ? { ...d, tags: [...d.tags, { id: tagId, label }] } : d
    );
    markDirty();
  }

  function deleteTag(dimId: string, tagId: string) {
    if (!session) return;
    session.dimensions = session.dimensions.map(d =>
      d.id === dimId ? { ...d, tags: d.tags.filter(t => t.id !== tagId) } : d
    );
    for (const meta of Object.values(session.papers)) {
      if (meta.tags[dimId]) {
        meta.tags[dimId] = meta.tags[dimId].filter(id => id !== tagId);
      }
    }
    session = session;
    markDirty();
  }

  function toggleTag(dimId: string, tagId: string) {
    if (!selectedId || !session) return;
    const meta = ensureMeta(selectedId);
    if (!meta.tags[dimId]) meta.tags[dimId] = [];
    const has = meta.tags[dimId].includes(tagId);
    meta.tags[dimId] = has
      ? meta.tags[dimId].filter(id => id !== tagId)
      : [...meta.tags[dimId], tagId];
    session = session;
    markDirty();
  }

  // ── Export ─────────────────────────────────────────────────────────
  function handleExportBib(entriesToExport: BibEntry[]) {
    const content = exportBib(entriesToExport);
    downloadFile(content, `${session?.name ?? 'prism'}-export.bib`, 'text/plain');
  }

  function handleExportCsv(entriesToExport: BibEntry[]) {
    if (!session) return;
    const content = exportCsv(entriesToExport, session.papers, session.dimensions);
    downloadFile(content, `${session?.name ?? 'prism'}-export.csv`, 'text/csv');
  }

  // ── Analysis → select paper ────────────────────────────────────────────────
  function handleSelectPaperFromAnalysis(id: string) {
    activeView = 'review';
    selectedId = id;
  }
</script>

<!-- New session modal -->
{#if showNewSessionModal}
  <NewSessionModal
    onConfirm={handleCreateSession}
    onCancel={() => showNewSessionModal = false}
  />
{/if}

<!-- Top bar -->
<TopBar
  {session}
  {dirty}
  {activeView}
  onNewSession={handleNewSession}
  onOpenSession={handleOpenSession}
  onSaveSession={handleSaveSession}
  onAddBib={handleAddBib}
  onViewChange={(v) => { activeView = v; }}
/>

<!-- Body -->
<div class="flex-1 overflow-hidden flex flex-col">

  {#if !session}
    <!-- No session state -->
    <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center">
      <span class="text-amber-400 text-4xl leading-none">◈</span>
      <h1 class="text-sand-100 font-bold text-3xl tracking-wide">Prism</h1>
      <p class="text-sand-600 text-sm">Create a new <code class="font-mono bg-charcoal-700 text-amber-400 px-1.5 py-0.5 rounded text-xs">session</code> or open an existing one</p>
      <div class="flex gap-3 mt-2">
        <button
          on:click={handleNewSession}
          class="px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 text-[#1c1a16] hover:bg-amber-400 transition-colors cursor-pointer"
        >New session</button>
        <button
          on:click={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleOpenSession(f); }; i.click(); }}
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-stone-600 text-sand-400 hover:bg-charcoal-700 hover:text-sand-200 transition-colors cursor-pointer"
        >Open session</button>
      </div>
    </div>

  {:else if activeView === 'analysis'}
    <AnalysisPanel
      {session}
      onSelectPaper={handleSelectPaperFromAnalysis}
    />

  {:else if entries.length === 0}
    <!-- Session open but no papers -->
    <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
      <span class="text-stone-600 text-3xl">📄</span>
      <p class="text-sand-200 font-bold text-sm">{session.name}</p>
      <p class="text-sand-600 text-sm">Add a <code class="font-mono bg-charcoal-700 text-amber-400 px-1.5 py-0.5 rounded text-xs">.bib</code> file to get started</p>
    </div>

  {:else}
    <!-- Two-column layout -->
    <div class="flex-1 grid grid-cols-[1fr_2fr] overflow-hidden">

      <!-- Left: paper list -->
      <PaperList
        {entries}
        papers={session.papers}
        dimensions={session.dimensions}
        defaultTab={entries.some(e => (session?.papers[e.id]?.status ?? 'unsorted') === 'unsorted') ? 'unsorted' : 'accepted'}
        {selectedId}
        onSelect={(id) => { selectedId = id; }}
        onDisplayedChange={(ids) => { displayedIds = ids; }}
        onExportBib={handleExportBib}
        onExportCsv={handleExportCsv}
      />

      <!-- Right: detail + tags -->
      <div class="flex flex-col gap-3 p-4 overflow-y-auto bg-charcoal-950">
        {#if selectedEntry && session}
          <ArticleCard
            entry={selectedEntry}
            meta={selectedMeta ?? { status: 'unsorted', tags: {} }}
            dimensions={session.dimensions}
            onSetStatus={setStatus}
            onToggleTag={toggleTag}
          />
          <TagPanel
            dimensions={session.dimensions}
            meta={selectedMeta ?? { status: 'unsorted', tags: {} }}
            onToggleTag={toggleTag}
            onAddDimension={addDimension}
            onAddTag={addTag}
            onUpdateDimensionColor={updateDimensionColor}
            onDeleteDimension={deleteDimension}
            onDeleteTag={deleteTag}
          />
        {:else}
          <div class="flex-1 flex items-center justify-center h-full">
            <p class="text-sand-600 text-sm italic">Select a paper from the list</p>
          </div>
        {/if}
      </div>

    </div>
  {/if}

</div>