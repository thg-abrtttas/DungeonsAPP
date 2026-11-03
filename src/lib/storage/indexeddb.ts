/**
 * Offline-first IndexedDB storage using Dexie
 * Handles characters, sessions, journal entries, and settings
 */

import Dexie, { Table } from 'dexie';
import type { UniversalCharacter } from '@/lib/character/types';

export interface Session {
  id: string;
  characterIds: string[];
  createdAt: string;
  updatedAt: string;
  currentSceneId?: string;
  notes: string;
}

export interface JournalEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'scene' | 'combat' | 'social' | 'exploration' | 'rest' | 'revelation' | 'note';
  title: string;
  content: string;
  imageUrls?: string[];
  participants: string[]; // character IDs
  tags: string[];
}

export interface AppSettings {
  id: 'settings';
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  autoSave: boolean;
  llmEnabled: boolean;
  llmApiKey?: string;
}

class DungeonsDB extends Dexie {
  characters!: Table<UniversalCharacter>;
  sessions!: Table<Session>;
  journal!: Table<JournalEntry>;
  settings!: Table<AppSettings>;

  constructor() {
    super('DungeonsAppDB');
    this.version(1).stores({
      characters: 'id, updatedAt, "portrait.name", "portrait.class", "portrait.level"',
      sessions: 'id, updatedAt, createdAt',
      journal: 'id, sessionId, timestamp, type',
      settings: 'id',
    });
  }
}

export const db = new DungeonsDB();

// Character operations
export async function saveCharacter(character: UniversalCharacter): Promise<string> {
  const now = new Date().toISOString();
  const toSave = {
    ...character,
    updatedAt: now,
    version: (character.version || 0) + 1,
  };
  await db.characters.put(toSave);
  return character.id;
}

export async function getCharacter(id: string): Promise<UniversalCharacter | undefined> {
  return db.characters.get(id);
}

export async function getAllCharacters(): Promise<UniversalCharacter[]> {
  return db.characters.orderBy('updatedAt').reverse().toArray();
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

// Session operations
export async function createSession(characterIds: string[]): Promise<Session> {
  const now = new Date().toISOString();
  const session: Session = {
    id: crypto.randomUUID(),
    characterIds,
    createdAt: now,
    updatedAt: now,
    notes: '',
  };
  await db.sessions.put(session);
  return session;
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}

export async function updateSession(session: Session): Promise<void> {
  await db.sessions.put({ ...session, updatedAt: new Date().toISOString() });
}

// Journal operations
export async function addJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.journal.put({ ...entry, id });
  return id;
}

export async function getJournalEntries(sessionId: string): Promise<JournalEntry[]> {
  return db.journal.where('sessionId').equals(sessionId).reverse().sortBy('timestamp');
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journal.put(entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journal.delete(id);
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('settings');
  return settings || {
    id: 'settings',
    theme: 'auto',
    soundEnabled: true,
    hapticsEnabled: true,
    autoSave: true,
    llmEnabled: true,
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...settings });
}

// Export/Import for backup
export async function exportAllData(): Promise<string> {
  const [characters, sessions, journal, settings] = await Promise.all([
    getAllCharacters(),
    getAllSessions(),
    db.journal.toArray(),
    getSettings(),
  ]);
  return JSON.stringify({ characters, sessions, journal, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction('rw', [db.characters, db.sessions, db.journal, db.settings], async () => {
    if (data.characters) {
      await db.characters.clear();
      await db.characters.bulkPut(data.characters);
    }
    if (data.sessions) {
      await db.sessions.clear();
      await db.sessions.bulkPut(data.sessions);
    }
    if (data.journal) {
      await db.journal.clear();
      await db.journal.bulkPut(data.journal);
    }
    if (data.settings) {
      await db.settings.put(data.settings);
    }
  });
}

// Initialize default data
export async function initializeDefaults(): Promise<void> {
  const settings = await getSettings();
  if (!settings.llmApiKey) {
    // Will be set by user
  }
}