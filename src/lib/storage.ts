import type { Invoice, Profile } from '../types';
import { SEED_PROFILES } from '../seed';

const KEY = {
  profiles: 'invoice-studio:v1:profiles',
  history: 'invoice-studio:v1:history',
  active: 'invoice-studio:v1:active-profile',
  draft: 'invoice-studio:v1:draft',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function loadProfiles(): Profile[] {
  const stored = read<Profile[] | null>(KEY.profiles, null);
  if (stored && stored.length) return stored;
  write(KEY.profiles, SEED_PROFILES);
  return SEED_PROFILES;
}

export const saveProfiles = (profiles: Profile[]) => write(KEY.profiles, profiles);

export const loadHistory = (): Invoice[] => read<Invoice[]>(KEY.history, []);
export const saveHistory = (history: Invoice[]) => write(KEY.history, history);

export const loadActiveProfileId = () => read<string | null>(KEY.active, null);
export const saveActiveProfileId = (id: string) => write(KEY.active, id);

export const loadDraft = () => read<Invoice | null>(KEY.draft, null);
export const saveDraft = (draft: Invoice) => write(KEY.draft, draft);

export interface Backup {
  app: 'invoice-studio';
  version: 1;
  exportedAt: string;
  profiles: Profile[];
  history: Invoice[];
}

export function makeBackup(profiles: Profile[], history: Invoice[]): Backup {
  return { app: 'invoice-studio', version: 1, exportedAt: new Date().toISOString(), profiles, history };
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text);
  if (!data || data.app !== 'invoice-studio' || !Array.isArray(data.profiles)) {
    throw new Error('This file is not an Invoice Studio backup.');
  }
  return { ...data, history: Array.isArray(data.history) ? data.history : [] };
}
