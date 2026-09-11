import { useState, useEffect, useCallback, useMemo } from 'react'
import { db, getOrCreateDeviceId, getDeviceLabel, seedIfEmpty } from '../db/database'
import type { Athlete, AthleteStatus, CheckRecord } from '../types/athlete'
import type { CheckinEvent } from '../types/sync'

export interface Stats {
  total: number
  validos: number
  invalidos: number
  pendentes: number
  checados: number
  pct: number
}

export function useChecagem() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    const all = await db.athletes.toArray()
    all.sort((a, b) => a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true }))
    setAthletes(all)
    setLoaded(true)
  }, [])

  useEffect(() => { seedIfEmpty().then(reload) }, [reload])

  const stats: Stats = useMemo(() => {
    const total = athletes.length
    const validos = athletes.filter(a => a.status === 'valido').length
    const invalidos = athletes.filter(a => a.status === 'invalido').length
    const checados = validos + invalidos
    const pendentes = total - checados
    const pct = total > 0 ? Math.round((checados / total) * 100) : 0
    return { total, validos, invalidos, pendentes, checados, pct }
  }, [athletes])

  const categorias = useMemo(
    () => Array.from(new Set(athletes.map(a => a.categoria).filter(Boolean) as string[])).sort(),
    [athletes]
  )
  const equipes = useMemo(
    () => Array.from(new Set(athletes.map(a => a.equipe).filter(Boolean) as string[])).sort(),
    [athletes]
  )
  const ufs = useMemo(
    () => Array.from(new Set(athletes.map(a => a.uf).filter(Boolean) as string[])).sort(),
    [athletes]
  )

  async function recordEvent(patch: {
    numero_inscricao: string; status: AthleteStatus; operador: string; checked_at: string;
  }): Promise<void> {
    const [device_id, device_label] = await Promise.all([getOrCreateDeviceId(), getDeviceLabel()])
    const event: CheckinEvent = {
      event_id: crypto.randomUUID(),
      numero_inscricao: patch.numero_inscricao,
      status: patch.status,
      operador: patch.operador,
      device_id,
      device_label: device_label || undefined,
      checked_at: patch.checked_at,
      synced: false,
    }
    await db.checkin_events.add(event)
  }

  async function confirmar(id: number, operador: string): Promise<CheckRecord> {
    const alvo = athletes.find(a => a.id === id)
    const record: CheckRecord = { status: 'valido', operador: operador || 'Operador', timestamp: new Date().toISOString() }
    await db.athletes.update(id, { status: 'valido' as AthleteStatus, historico: [record] })
    if (alvo) {
      await recordEvent({ numero_inscricao: alvo.numero_inscricao, status: 'valido', operador: record.operador, checked_at: record.timestamp })
    }
    await reload()
    return record
  }

  async function invalidar(id: number, operador: string): Promise<CheckRecord> {
    const alvo = athletes.find(a => a.id === id)
    const record: CheckRecord = { status: 'invalido', operador: operador || 'Operador', timestamp: new Date().toISOString() }
    await db.athletes.update(id, { status: 'invalido' as AthleteStatus, historico: [record] })
    if (alvo) {
      await recordEvent({ numero_inscricao: alvo.numero_inscricao, status: 'invalido', operador: record.operador, checked_at: record.timestamp })
    }
    await reload()
    return record
  }

  async function refazer(id: number, operador: string): Promise<void> {
    const alvo = athletes.find(a => a.id === id)
    await db.athletes.update(id, { status: 'pendente' as AthleteStatus, historico: [] })
    if (alvo) {
      await recordEvent({ numero_inscricao: alvo.numero_inscricao, status: 'pendente', operador: operador || 'Operador', checked_at: new Date().toISOString() })
    }
    await reload()
  }

  async function zerarTudo(operador: string): Promise<void> {
    const all = await db.athletes.toArray()
    const checados = all.filter(a => a.status !== 'pendente')
    await db.athletes.bulkPut(all.map(a => ({ ...a, status: 'pendente' as AthleteStatus, historico: [] })))
    const now = new Date().toISOString()
    const [device_id, device_label] = await Promise.all([getOrCreateDeviceId(), getDeviceLabel()])
    await db.checkin_events.bulkAdd(checados.map(a => ({
      event_id: crypto.randomUUID(), numero_inscricao: a.numero_inscricao, status: 'pendente' as AthleteStatus,
      operador: operador || 'Operador', device_id, device_label: device_label || undefined, checked_at: now, synced: false,
    })))
    await reload()
  }

  return { athletes, loaded, stats, categorias, equipes, ufs, reload, confirmar, invalidar, refazer, zerarTudo }
}
