import type { Athlete, CheckRecord } from '../types/athlete';
import type { CheckinEvent, Conflict } from '../types/sync';
import { mergeEvents, detectConflicts } from '../types/sync';
import { buildMergedAthletes } from './mergeBackups';

export interface OfficialReport {
  atletas: Athlete[];
  conflitos: Conflict[];
}

const STATUS_LABEL: Record<CheckinEvent['status'], string> = {
  valido: 'Aprovado', invalido: 'Desclassificado', pendente: 'Pendente',
};

function formatHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function conflictNote(c: Conflict): string {
  const partes = c.eventos.map(e =>
    `${e.device_label || 'Aparelho ' + e.device_id.slice(0, 6)} marcou ${STATUS_LABEL[e.status]} às ${formatHora(e.checked_at)}`
  );
  return `⚠ Divergência entre aparelhos — ${partes.join(' · ')}`;
}

/**
 * Monta a listagem oficial combinada: pega o roster local (igual em todos os
 * aparelhos) e aplica por cima o resultado mesclado de todos os eventos
 * (locais + nuvem). Atletas checados de forma diferente em mais de um
 * aparelho ganham uma observação visível no relatório, em vez de terem a
 * divergência escondida por trás de "o mais recente venceu".
 */
export function buildOfficialReport(roster: Athlete[], events: CheckinEvent[]): OfficialReport {
  const merged = mergeEvents(events);
  const conflitos = detectConflicts(events);
  const conflitoPorNumero = new Map(conflitos.map(c => [c.numero_inscricao, c]));

  const base = buildMergedAthletes(roster, merged);
  const atletas = base.map(a => {
    const conflito = conflitoPorNumero.get(a.numero_inscricao);
    if (!conflito) return a;
    const nota = conflictNote(conflito);
    const atual = a.historico[0];
    const record: CheckRecord = atual
      ? { ...atual, observacao: [atual.observacao, nota].filter(Boolean).join(' — ') }
      : { status: a.status === 'invalido' ? 'invalido' : 'valido', operador: 'Sistema', timestamp: new Date().toISOString(), observacao: nota };
    return { ...a, historico: [record] };
  });

  return { atletas, conflitos };
}
