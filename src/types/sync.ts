import type { AthleteStatus, InvalidationReason } from './athlete';

/** Evento imutável de checagem — a unidade que sincroniza entre aparelhos. */
export interface CheckinEvent {
  event_id: string;
  numero_inscricao: string;
  status: AthleteStatus;
  motivo?: InvalidationReason;
  observacao?: string;
  operador: string;
  device_id: string;
  device_label?: string;
  checked_at: string;
  /** só existe localmente (Dexie); nunca é enviado ao Supabase */
  synced?: boolean;
}

export interface Conflict {
  numero_inscricao: string;
  eventos: CheckinEvent[];
}

function isNewer(a: CheckinEvent, b: CheckinEvent): boolean {
  if (a.checked_at !== b.checked_at) return a.checked_at > b.checked_at;
  return a.event_id > b.event_id;
}

/**
 * Estado combinado atual: para cada numero_inscricao, o evento mais recente
 * entre todas as fontes (aparelho local, Supabase, arquivos de backup).
 * Único ponto de verdade — usado no sync automático, na visão ao vivo e no
 * merge manual de arquivos.
 */
export function mergeEvents(events: CheckinEvent[]): Map<string, CheckinEvent> {
  const current = new Map<string, CheckinEvent>();
  for (const ev of events) {
    const prev = current.get(ev.numero_inscricao);
    if (!prev || isNewer(ev, prev)) current.set(ev.numero_inscricao, ev);
  }
  return current;
}

/** Atletas com eventos de mais de um aparelho e status divergente entre eles. */
export function detectConflicts(events: CheckinEvent[]): Conflict[] {
  const byAtleta = new Map<string, CheckinEvent[]>();
  for (const ev of events) {
    const arr = byAtleta.get(ev.numero_inscricao) ?? [];
    arr.push(ev);
    byAtleta.set(ev.numero_inscricao, arr);
  }
  const conflicts: Conflict[] = [];
  for (const [numero_inscricao, eventos] of byAtleta) {
    const devices = new Set(eventos.map(e => e.device_id));
    const statuses = new Set(eventos.map(e => e.status));
    if (devices.size > 1 && statuses.size > 1) {
      conflicts.push({
        numero_inscricao,
        eventos: [...eventos].sort((a, b) => a.checked_at.localeCompare(b.checked_at)),
      });
    }
  }
  return conflicts.sort((a, b) => a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true }));
}
