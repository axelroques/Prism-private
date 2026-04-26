import type { Session } from './types';

const STORAGE_KEY = 'prism-session';

export function saveSession(session: Session): void {
  session.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; }
  catch { return null; }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function importSession(file: File): Promise<Session> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target?.result as string) as Session); }
      catch { reject(new Error('Invalid session file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function makeEmptySession(fileHash: string, fileName: string): Session {
  return {
    fileHash,
    fileName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    papers: {},
    dimensions: [],
  };
}