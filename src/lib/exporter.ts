import type { BibEntry, PaperMeta, Dimension } from './types';

// ── BIB export ─────────────────────────────────────────────────────────────

export function exportBib(entries: BibEntry[]): string {
  return entries.map(entry => {
    const { id, ...fields } = entry;
    const fieldStr = Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `  ${k} = {${v}}`)
      .join(',\n');
    return `@article{${id},\n${fieldStr}\n}`;
  }).join('\n\n');
}

// ── CSV export ─────────────────────────────────────────────────────────────

const CORE_FIELDS = ['doi', 'author', 'title', 'year', 'journal', 'booktitle', 'abstract'] as const;

function escapeCell(val: string): string {
  const s = val.replace(/"/g, '""');
  return `"${s}"`;
}

export function exportCsv(
  entries: BibEntry[],
  papers: Record<string, PaperMeta>,
  dimensions: Dimension[]
): string {
  const dimHeaders = dimensions.map(d => d.label);
  const headers = [...CORE_FIELDS, ...dimHeaders];

  const rows = entries.map(entry => {
    const core = CORE_FIELDS.map(f => escapeCell(entry[f] ?? ''));

    const dimCols = dimensions.map(dim => {
      const activeTagIds = papers[entry.id]?.tags?.[dim.id] ?? [];
      const tagLabels = activeTagIds
        .map(tagId => dim.tags.find(t => t.id === tagId)?.label)
        .filter((l): l is string => l !== undefined);
      return escapeCell(tagLabels.join(', '));
    });

    return [...core, ...dimCols].join(',');
  });

  return [headers.map(escapeCell).join(','), ...rows].join('\n');
}

// ── Download helper ────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}