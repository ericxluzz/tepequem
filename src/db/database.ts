import Dexie, { type Table } from 'dexie';
import type { Athlete } from '../types/athlete';
import type { CheckinEvent } from '../types/sync';
import { getSeedAthletes } from '../data/atletasSeed';

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

export class TepequemDatabase extends Dexie {
  athletes!: Table<Athlete>;
  settings!: Table<AppSettings>;
  checkin_events!: Table<CheckinEvent>;

  constructor() {
    super('tepequem-up-2026');

    this.version(1).stores({
      athletes: '++id, numero_inscricao, status, categoria, sexo, _search, nome_mae, nome_pai, cpf, telefone',
      settings: '++id, key',
    });

    this.version(2).stores({
      athletes: '++id, numero_inscricao, status, categoria, sexo, _search, nome_mae, nome_pai, cpf, telefone',
      settings: '++id, key',
      checkin_events: '&event_id, numero_inscricao, checked_at, synced, device_id',
    });

    // Remove duplicatas de numero_inscricao que possam ter ficado de uma
    // corrida no seed antigo, antes de tornar o campo um índice único abaixo
    // (criar índice único sobre dado duplicado faria a migração falhar).
    this.version(3).stores({
      athletes: '++id, numero_inscricao, status, categoria, sexo, _search, nome_mae, nome_pai, cpf, telefone',
      settings: '++id, key',
      checkin_events: '&event_id, numero_inscricao, checked_at, synced, device_id',
    }).upgrade(async (tx) => {
      const seen = new Set<string>();
      const idsToRemove: number[] = [];
      await tx.table('athletes').toCollection().each((a: Athlete) => {
        if (seen.has(a.numero_inscricao)) {
          if (a.id !== undefined) idsToRemove.push(a.id);
        } else {
          seen.add(a.numero_inscricao);
        }
      });
      if (idsToRemove.length) await tx.table('athletes').bulkDelete(idsToRemove);
    });

    // numero_inscricao vira índice único: nunca mais permite duas linhas do
    // mesmo peito na base local (proteção extra contra seed/import em duplicidade).
    this.version(4).stores({
      athletes: '++id, &numero_inscricao, status, categoria, sexo, _search, nome_mae, nome_pai, cpf, telefone',
      settings: '++id, key',
      checkin_events: '&event_id, numero_inscricao, checked_at, synced, device_id',
    });
  }
}

export const db = new TepequemDatabase();

// --- Settings helpers ---

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing?.id !== undefined) {
    await db.settings.update(existing.id, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

// --- Identidade do aparelho ---

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getSetting('device_id');
  if (existing) return existing;
  const id = crypto.randomUUID();
  await setSetting('device_id', id);
  return id;
}

export async function getDeviceLabel(): Promise<string> {
  return (await getSetting('device_label')) || '';
}

export async function setDeviceLabel(label: string): Promise<void> {
  await setSetting('device_label', label);
}

// --- Athlete helpers ---

/**
 * Na primeira vez que o app abre num aparelho (base local vazia), carrega a
 * planilha oficial embutida. O guard evita que duas chamadas simultâneas
 * (ex.: o StrictMode do React invocando o efeito duas vezes) dupliquem tudo.
 */
let seedInFlight: Promise<boolean> | null = null;

export function seedIfEmpty(): Promise<boolean> {
  if (!seedInFlight) {
    seedInFlight = (async () => {
      const count = await db.athletes.count();
      if (count > 0) return false;
      try {
        await db.athletes.bulkAdd(getSeedAthletes());
        return true;
      } catch (err) {
        // corrida com outra chamada concorrente semeando os mesmos dados ao
        // mesmo tempo — se a base já ficou populada, tudo bem, só ignora.
        const after = await db.athletes.count();
        if (after > 0) return false;
        throw err;
      }
    })().finally(() => { seedInFlight = null; });
  }
  return seedInFlight;
}

export async function getStats() {
  const total = await db.athletes.count();
  const validos = await db.athletes.where('status').equals('valido').count();
  const invalidos = await db.athletes.where('status').equals('invalido').count();
  const pendentes = total - validos - invalidos;
  return { total, validos, invalidos, pendentes };
}
