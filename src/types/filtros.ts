import type { AthleteStatus } from './athlete'

export type FiltroStatus = AthleteStatus | 'todos'

export const ORDENS = ['Nome (A–Z)', 'Nome (Z–A)', 'Nº de inscrição', 'Checagem recente'] as const
export type Ordem = typeof ORDENS[number]

export interface Filtros {
  query: string
  status: FiltroStatus
  categoria: string
  sexo: string
  uf: string
  equipe: string
  ordem: Ordem
}

export const FILTROS_VAZIOS: Filtros = {
  query: '', status: 'todos', categoria: 'Todas', sexo: 'Todos', uf: 'Todas', equipe: 'Todas', ordem: 'Nome (A–Z)',
}

export function contarFiltrosAtivos(f: Filtros): number {
  return [f.categoria !== 'Todas', f.sexo !== 'Todos', f.uf !== 'Todas', f.equipe !== 'Todas'].filter(Boolean).length
}
