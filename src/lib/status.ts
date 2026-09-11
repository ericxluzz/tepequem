import type { AthleteStatus } from '../types/athlete'

export interface StatusStyle {
  dot: string
  fg: string
  bg: string
  label: string
}

export function statusStyle(status: AthleteStatus): StatusStyle {
  if (status === 'valido') return { dot: 'var(--ok)', fg: 'var(--okInk)', bg: 'var(--okBg)', label: 'Válido' }
  if (status === 'invalido') return { dot: 'var(--bad)', fg: 'var(--badInk)', bg: 'var(--badBg)', label: 'Inválido' }
  return { dot: 'var(--ink3)', fg: 'var(--ink2)', bg: 'var(--row)', label: 'Pendente' }
}

export function shortCategoria(c: string | undefined): string {
  return String(c || '—').replace('Diamante ', '').replace('Masculino', 'Masc').replace('Feminino', 'Fem')
}
