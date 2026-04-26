import type { Session, Template } from './types';

export function makeEmptySession(name: string): Session {
  return {
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: [],
    papers: {},
    dimensions: [],
  };
}

export function makeSessionFromTemplate(name: string, template: Template): Session {
  return {
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: [],
    papers: {},
    dimensions: template.dimensions,
  };
}

export function readSessionFile(file: File): Promise<Session> {
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

export function readTemplateFile(file: File): Promise<Template> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // Accept either a full session file or a bare template
        const dimensions = parsed.dimensions ?? [];
        resolve({ dimensions });
      }
      catch { reject(new Error('Invalid template file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function saveSessionFile(session: Session): void {
  session.updatedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.name.replace(/\s+/g, '-').toLowerCase()}.prism.json`;
  a.click();
  URL.revokeObjectURL(url);
}
