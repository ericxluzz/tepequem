import type { AthleteStatus } from './athlete';

/** Evento imutável de checagem — a unidade que sincroniza entre aparelhos. */
export interface CheckinEvent {
  event_id: string;
  numero_inscricao: string;
  status: AthleteStatus;
  motivo?: string;
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

/**
 * Atletas com o estado ATUAL divergente entre aparelhos — ou seja, pega só a
 * ação mais recente de cada aparelho (não o histórico inteiro) e compara os
 * status entre eles. Assim, se dois aparelhos discordaram no passado mas
 * hoje concordam (ex.: os dois zeraram/confirmaram por último), o conflito
 * não fica preso pra sempre — só existe enquanto o desacordo é atual.
 */
export function detectConflicts(events: CheckinEvent[]): Conflict[] {
  const byAtleta = new Map<string, CheckinEvent[]>();
  for (const ev of events) {
    const arr = byAtleta.get(ev.numero_inscricao) ?? [];
    arr.push(ev);
    byAtleta.set(ev.numero_inscricao, arr);
  }
  const conflicts: Conflict[] = [];
  for (const [numero_inscricao, eventos] of byAtleta) {
    const latestPorAparelho = new Map<string, CheckinEvent>();
    for (const ev of eventos) {
      const prev = latestPorAparelho.get(ev.device_id);
      if (!prev || isNewer(ev, prev)) latestPorAparelho.set(ev.device_id, ev);
    }
    const atuais = [...latestPorAparelho.values()];
    const statuses = new Set(atuais.map(e => e.status));
    if (atuais.length > 1 && statuses.size > 1) {
      conflicts.push({
        numero_inscricao,
        eventos: atuais.sort((a, b) => a.checked_at.localeCompare(b.checked_at)),
      });
    }
  }
  return conflicts.sort((a, b) => a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true }));
}
