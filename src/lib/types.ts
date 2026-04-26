export interface RawBibEntry {
  id: string;
  type: string;
  raw: unknown;
  tags: Record<string, string>;
}

export interface BibEntry {
  id: string;
  title?: string;
  author?: string;
  year?: string;
  journal?: string;
  booktitle?: string;
  abstract?: string;
  doi?: string;
  keywords?: string;
  [key: string]: string | undefined;
}

export type PaperStatus = 'unsorted' | 'accepted' | 'rejected';

export interface Tag {
  id: string;
  label: string;
}

export interface Dimension {
  id: string;
  label: string;
  color: string;
  tags: Tag[];
}

export interface PaperMeta {
  status: PaperStatus;
  tags: Record<string, string[]>; // dimensionId → tagId[]
}

export interface Session {
  fileHash: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  papers: Record<string, PaperMeta>; // bibEntry.id → meta
  dimensions: Dimension[];
}