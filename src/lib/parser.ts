
import bibtexParse from '@orcid/bibtex-parse-js';
import type { BibEntry } from './types';

// export function parseBib(text: string): BibEntry[] {
export function parseBib(text: string): BibEntry[] {
  const parsed = bibtexParse.toJSON(text);
  return parsed.map((entry: any, index: number): BibEntry => {
    const tags = entry.entryTags as Record<string, string>;
    return {
      id: entry.citationKey || `entry-${index}`,
      ...tags
    };
  });
}
