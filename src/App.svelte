<script lang="ts">
  import './app.css';
  import TopBar from './lib/components/TopBar.svelte';
  import PaperList from './lib/components/PaperList.svelte';
  import ArticleCard from './lib/components/ArticleCard.svelte';
  import TagPanel from './lib/components/TagPanel.svelte';

  import type { BibEntry, PaperMeta, PaperStatus, Session } from './lib/types';
  import { exportBib, exportCsv, downloadFile } from './lib/exporter';
  import { parseBib } from './lib/parser';
  import { simpleHash } from './lib/utils';
  import {
    saveSession, loadSession, clearSession,
    importSession, makeEmptySession,
  } from './lib/session';

  // ── State ──────────────────────────────────────────────────────────────────
  let entries: BibEntry[] = [];
  let session: Session | null = null;
  let selectedId: string | null = null;

  // ── Derived ────────────────────────────────────────────────────────────────
  $: selectedEntry  = entries.find(e => e.id === selectedId) ?? null;
  $: selectedMeta   = (selectedId && session?.papers[selectedId]) || null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function persist() {
    if (session) saveSession(session);
  }

  function ensureMeta(id: string): PaperMeta {
    if (!session!.papers[id]) {
      session!.papers[id] = { status: 'unsorted', tags: {} };
    }
    return session!.papers[id];
  }

  // ── File / session loading ─────────────────────────────────────────────────
  async function handleLoadBib(file: File) {
    const text = await file.text();
    const hash = simpleHash(text);
    entries = parseBib(text);

    const stored = loadSession();
    if (stored && stored.fileHash === hash) {
      session = stored;
    } else {
      session = makeEmptySession(hash, file.name);
      persist();
    }

    // First paper selected is the first from the unsorted list if non empty or the accepted list
    const firstUnsorted = entries.find(e => (session!.papers[e.id]?.status ?? 'unsorted') === 'unsorted');
    selectedId = firstUnsorted?.id ?? entries.find(e => session!.papers[e.id]?.status === 'accepted')?.id ?? null;
  }

  async function handleOpenSession(file: File) {
    try {
      session = await importSession(file);
      persist();
      // Prompt user to reload their .bib if no entries are loaded yet
      if (!entries.length) {
        alert(`Session "${session.fileName}" loaded. Please also load the matching .bib file.`);
      } else {
        selectedId = entries[0]?.id ?? null;
      }
    } catch {
      alert('Could not load session file. Make sure it is a valid Prism session.');
    }
  }

  function handleNewSession() {
    if (!confirm('Start a new session? Unsaved changes will be lost.')) return;
    clearSession();
    entries = [];
    session = null;
    selectedId = null;
  }

  function handleSaveSession() {
    persist();
  }

  // ── Export list content ─────────────────────────────────────────────────────────
  function handleExportBib(entries: BibEntry[]) {
    const content = exportBib(entries);
    downloadFile(content, 'prism-export.bib', 'text/plain');
  }

  function handleExportCsv(entries: BibEntry[]) {
    if (!session) return;
    const content = exportCsv(entries, session.papers, session.dimensions);
    downloadFile(content, 'prism-export.csv', 'text/csv');
  }

  // ── Review actions ─────────────────────────────────────────────────────────
  function setStatus(status: PaperStatus) {
    if (!selectedId || !session) return;
    ensureMeta(selectedId).status = status;
    session = session;
    persist();

    // Advance to next unsorted, or first accepted if none left
    const unsorted = entries.filter(e => (session!.papers[e.id]?.status ?? 'unsorted') === 'unsorted');
    if (unsorted.length > 0) {
      selectedId = unsorted[0].id;
    } else {
      const accepted = entries.filter(e => session!.papers[e.id]?.status === 'accepted');
      selectedId = accepted[0]?.id ?? null;
    }
  }

  // ── Tag actions ────────────────────────────────────────────────────────────
  const PALETTE = ['#f59e0b', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#22d3ee'];
  function addDimension(label: string) {
    if (!session) return;
    const color = PALETTE[session.dimensions.length % PALETTE.length];
    session.dimensions = [...session.dimensions, {
      id: crypto.randomUUID(), label, color, tags: [],
    }];
    persist();
  }

  function updateDimensionColor(dimId: string, color: string) {
    if (!session) return;
    session.dimensions = session.dimensions.map(d =>
      d.id === dimId ? { ...d, color } : d
    );
    session = session;
    persist();
  }

  function deleteDimension(dimId: string) {
    if (!session) return;
    session.dimensions = session.dimensions.filter(d => d.id !== dimId);
    for (const meta of Object.values(session.papers)) delete meta.tags[dimId];
    session = session;
    persist();
  }

  function addTag(dimId: string, label: string) {
    if (!session) return;
    const tagId = crypto.randomUUID();
    session.dimensions = session.dimensions.map(d =>
      d.id === dimId ? { ...d, tags: [...d.tags, { id: tagId, label }] } : d
    );
    persist();
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
    persist();
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
    persist();
  }
</script>

<!-- Top bar -->
<TopBar
  {session}
  onNewSession={handleNewSession}
  onOpenSession={handleOpenSession}
  onSaveSession={handleSaveSession}
  onLoadBib={handleLoadBib}
/>

<!-- Body -->
<div class="flex-1 overflow-hidden flex flex-col">

  {#if entries.length === 0}
    <!-- Empty state -->
    <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
      <span class="text-amber-400 text-4xl leading-none">◈</span>
      <h1 class="text-sand-100 font-bold text-3xl tracking-wide">Prism</h1>
      <p class="text-sand-600 text-sm">
        Load a <code class="font-mono bg-charcoal-700 text-amber-400 px-1.5 py-0.5 rounded text-xs">.bib</code>
        file to begin
      </p>
    </div>

  {:else}
    <!-- Two-column layout -->
    <div class="flex-1 grid grid-cols-[1fr_2fr] overflow-hidden">

      <!-- Left: paper list -->
      <PaperList
        {entries}
        papers={session?.papers ?? {}}
        dimensions={session?.dimensions ?? []}
        defaultTab={entries.some(e => (session?.papers[e.id]?.status ?? 'unsorted') === 'unsorted') ? 'unsorted' : 'accepted'}
        {selectedId}
        onSelect={(id) => { selectedId = id; }}
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