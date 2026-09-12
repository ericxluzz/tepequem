import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { checkConnectivity, pushPendingEvents, pullAllEvents, countPending } from '../lib/sync'
import { mergeEvents, detectConflicts } from '../types/sync'
import type { CheckinEvent } from '../types/sync'
import type { Stats } from './useChecagem'
import { db, getSetting, setSetting } from '../db/database'

const POLL_MIN_MS = 25_000
const POLL_MAX_MS = 300_000

function computeCombinedStats(merged: Map<string, CheckinEvent>): Stats {
  let validos = 0, invalidos = 0
  for (const ev of merged.values()) {
    if (ev.status === 'valido') validos++
    else if (ev.status === 'invalido') invalidos++
  }
  const checados = validos + invalidos
  return { total: 0, validos, invalidos, pendentes: 0, checados, pct: 0 }
}

export function useSync() {
  const [connected, setConnected] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [rawEvents, setRawEvents] = useState<CheckinEvent[] | null>(null)
  const [cloudWasReset, setCloudWasReset] = useState(false)
  const pollDelay = useRef(POLL_MIN_MS)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasConnected = useRef(false)
  const syncingRef = useRef(false)

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await countPending())
  }, [])

  // Detecta se a nuvem foi zerada por outro aparelho (ou via SQL manual): se
  // este aparelho já tem eventos marcados como enviados que sumiram do
  // resultado da nuvem, é porque alguém apagou tudo — não tem outro jeito de
  // um evento "enviado" deixar de existir lá.
  const checkCloudReset = useCallback(async (remote: CheckinEvent[]) => {
    const ackAt = await getSetting('cloudResetAckAt')
    const localSynced = (await db.checkin_events.toArray())
      .filter(e => e.synced && (!ackAt || e.checked_at > ackAt))
    if (localSynced.length === 0) return
    const remoteIds = new Set(remote.map(e => e.event_id))
    if (localSynced.some(e => !remoteIds.has(e.event_id))) setCloudWasReset(true)
  }, [])

  const dismissCloudReset = useCallback(async () => {
    await setSetting('cloudResetAckAt', new Date().toISOString())
    setCloudWasReset(false)
  }, [])

  const pullCombined = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const events = await pullAllEvents()
    setRawEvents(events)
    checkCloudReset(events)
  }, [checkCloudReset])

  const syncNow = useCallback(async (): Promise<{ ok: boolean; sent: number }> => {
    if (!isSupabaseConfigured || syncingRef.current) return { ok: false, sent: 0 }
    syncingRef.current = true
    setSyncing(true)
    try {
      const ok = await checkConnectivity()
      setConnected(ok)
      if (ok) {
        const { sent, failed } = await pushPendingEvents()
        await refreshPendingCount()
        await pullCombined()
        pollDelay.current = failed ? Math.min(pollDelay.current * 2, POLL_MAX_MS) : POLL_MIN_MS
        return { ok: !failed, sent }
      }
      pollDelay.current = Math.min(pollDelay.current * 2, POLL_MAX_MS)
      return { ok: false, sent: 0 }
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [pullCombined, refreshPendingCount])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    refreshPendingCount()

    function scheduleNext() {
      timerRef.current = setTimeout(async () => {
        await syncNow()
        scheduleNext()
      }, pollDelay.current)
    }

    function handleOnline() { syncNow() }
    window.addEventListener('online', handleOnline)
    syncNow()
    scheduleNext()

    return () => {
      window.removeEventListener('online', handleOnline)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: mantém a listagem combinada em dia com qualquer mudança na
  // tabela — inserção de outro aparelho, mas também remoção/edição feita direto
  // no painel do Supabase (ex.: uma limpeza de dados de teste).
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const client = supabase
    const channel = client
      .channel('checkin_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_events' }, (payload) => {
        setRawEvents(prev => {
          const list = prev || []
          if (payload.eventType === 'INSERT') {
            return [...list, payload.new as CheckinEvent]
          }
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CheckinEvent
            return list.map(e => e.event_id === updated.event_id ? updated : e)
          }
          if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as Partial<CheckinEvent>).event_id
            return list.filter(e => e.event_id !== removedId)
          }
          return list
        })
      })
      .subscribe()
    return () => { client.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!wasConnected.current && connected) refreshPendingCount()
    wasConnected.current = connected
  }, [connected, refreshPendingCount])

  const combined = useMemo(() => rawEvents ? mergeEvents(rawEvents) : null, [rawEvents])
  const conflitos = useMemo(() => rawEvents ? detectConflicts(rawEvents) : [], [rawEvents])
  const combinedStats = useMemo(() => combined ? computeCombinedStats(combined) : null, [combined])

  return {
    isSupabaseConfigured,
    connected,
    syncing,
    pendingCount,
    syncNow,
    rawEvents,
    combined,
    combinedStats,
    conflitos,
    cloudWasReset,
    dismissCloudReset,
  }
}
