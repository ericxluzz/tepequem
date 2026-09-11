import { db } from '../db/database';
import { supabase, isSupabaseConfigured, EVENT_CODE } from './supabaseClient';
import type { CheckinEvent } from '../types/sync';

const CHUNK = 50;

function toRemoteRow(ev: CheckinEvent) {
  const { synced: _synced, ...rest } = ev;
  return { ...rest, event_code: EVENT_CODE };
}

/**
 * navigator.onLine é otimista demais (acusa "online" em rede local sem
 * internet de verdade) — confirma com uma consulta barata e rápida.
 */
export async function checkConnectivity(): Promise<boolean> {
  if (!navigator.onLine || !supabase) return false;
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const { error } = await supabase
      .from('checkin_events')
      .select('event_id')
      .limit(1)
      .abortSignal(ctrl.signal);
    clearTimeout(timeout);
    return !error;
  } catch {
    return false;
  }
}

export async function countPending(): Promise<number> {
  return db.checkin_events.filter(e => !e.synced).count();
}

export async function pushPendingEvents(): Promise<{ sent: number; failed: boolean }> {
  if (!isSupabaseConfigured || !supabase) return { sent: 0, failed: false };
  const pending = await db.checkin_events.filter(e => !e.synced).toArray();
  if (pending.length === 0) return { sent: 0, failed: false };

  let sent = 0;
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch = pending.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('checkin_events')
      .upsert(batch.map(toRemoteRow), { onConflict: 'event_id', ignoreDuplicates: true });
    if (error) return { sent, failed: true };
    await db.checkin_events.where('event_id').anyOf(batch.map(e => e.event_id)).modify({ synced: true });
    sent += batch.length;
  }
  return { sent, failed: false };
}

export async function pullAllEvents(): Promise<CheckinEvent[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('checkin_events')
    .select('*')
    .eq('event_code', EVENT_CODE);
  if (error || !data) return [];
  return data as CheckinEvent[];
}
