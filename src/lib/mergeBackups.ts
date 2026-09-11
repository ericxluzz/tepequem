import type { Athlete, CheckRecord } from '../types/athlete';
import type { CheckinEvent } from '../types/sync';

export interface ParsedBackup {
  source: string;
  eventos: CheckinEvent[];
}

interface BackupFileShape {
  operador?: string;
  device_id?: string;
  device_label?: string;
  atletas?: Athlete[];
  eventos?: CheckinEvent[];
}

/** hash simples e estável só para dar um device_id determinístico a backups antigos (sem eventos[]) */
function fallbackDeviceId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return 'legacy-' + Math.abs(h).toString(16);
}

export async function parseBackupFile(file: File): Promise<ParsedBackup> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupFileShape;
  const source = file.name.replace(/\.json$/i, '');

  if (data.eventos && data.eventos.length > 0) {
    return { source: data.device_label || source, eventos: data.eventos };
  }

  // backup antigo (de antes da tabela checkin_events existir): sintetiza um
  // evento por atleta a partir do historico[0], usando o nome do arquivo como
  // identidade do aparelho de origem.
  const device_id = data.device_id || fallbackDeviceId(source);
  const device_label = data.device_label || source;
  const eventos: CheckinEvent[] = (data.atletas || [])
    .filter(a => a.status !== 'pendente' && a.historico?.[0])
    .map(a => {
      const h = a.historico[0] as CheckRecord;
      return {
        event_id: `${device_id}:${a.numero_inscricao}`,
        numero_inscricao: a.numero_inscricao,
        status: h.status,
        motivo: h.motivo as CheckinEvent['motivo'],
        observacao: h.observacao,
        operador: h.operador || data.operador || 'Operador',
        device_id,
        device_label,
        checked_at: h.timestamp || new Date(0).toISOString(),
      };
    });
  return { source: device_label, eventos };
}

/**
 * Reconstrói uma lista de Athlete completa (nome, CPF, etc.) a partir do
 * roster local deste aparelho, aplicando por cima o status combinado vindo
 * do merge de eventos — usada só para alimentar generateReport/openPrintReport.
 */
export function buildMergedAthletes(roster: Athlete[], merged: Map<string, CheckinEvent>): Athlete[] {
  return roster.map(a => {
    const ev = merged.get(a.numero_inscricao);
    if (!ev) return a;
    const historico: CheckRecord[] = ev.status === 'pendente' ? [] : [{
      status: ev.status as 'valido' | 'invalido',
      motivo: ev.motivo,
      observacao: ev.observacao,
      operador: ev.operador,
      timestamp: ev.checked_at,
    }];
    return { ...a, status: ev.status, historico };
  });
}
