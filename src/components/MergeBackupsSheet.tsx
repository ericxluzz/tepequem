import { useRef, useState } from 'react'
import { Sheet, SheetFooter } from './Sheet'
import { ConfirmDialog } from './ConfirmDialog'
import { db } from '../db/database'
import type { Athlete } from '../types/athlete'
import type { CheckinEvent, Conflict } from '../types/sync'
import { mergeEvents, detectConflicts } from '../types/sync'
import { parseBackupFile, buildMergedAthletes } from '../lib/mergeBackups'
import { generateReport, openPrintReport } from '../lib/export'

interface MergeBackupsSheetProps {
  athletes: Athlete[]
  onClose: () => void
  onApplied: () => void
}

export function MergeBackupsSheet({ athletes, onClose, onApplied }: MergeBackupsSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [fontes, setFontes] = useState<string[]>([])
  const [merged, setMerged] = useState<Map<string, CheckinEvent> | null>(null)
  const [conflitos, setConflitos] = useState<Conflict[]>([])
  const [confirmandoAplicar, setConfirmandoAplicar] = useState(false)
  const [aplicando, setAplicando] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setLoading(true)
    setErro('')
    try {
      const parsed = await Promise.all(files.map(parseBackupFile))
      const locais = await db.checkin_events.toArray()
      const todosEventos = [...locais, ...parsed.flatMap(p => p.eventos)]
      setMerged(mergeEvents(todosEventos))
      setConflitos(detectConflicts(todosEventos))
      setFontes(['Este aparelho', ...parsed.map(p => p.source)])
    } catch (err) {
      setErro(`Erro ao ler arquivo: ${(err as Error).message}`)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const resultado = merged ? buildMergedAthletes(athletes, merged) : null
  const totais = resultado ? {
    validos: resultado.filter(a => a.status === 'valido').length,
    invalidos: resultado.filter(a => a.status === 'invalido').length,
    pendentes: resultado.filter(a => a.status === 'pendente').length,
  } : null

  async function handleExportar(formato: 'excel' | 'pdf') {
    if (!resultado) return
    if (formato === 'excel') await generateReport(resultado)
    else openPrintReport(resultado)
  }

  async function handleAplicar() {
    if (!resultado || !merged) return
    setAplicando(true)
    try {
      await db.athletes.bulkPut(resultado)
      const existentes = new Set((await db.checkin_events.toArray()).map(e => e.event_id))
      const novos = [...merged.values()].filter(ev => !existentes.has(ev.event_id))
      if (novos.length) await db.checkin_events.bulkAdd(novos.map(ev => ({ ...ev, synced: false })))
      onApplied()
      onClose()
    } finally {
      setAplicando(false)
      setConfirmandoAplicar(false)
    }
  }

  return (
    <>
      <Sheet onClose={onClose} wide>
        <div className="flex items-center justify-between border-b px-4.5 py-3.5" style={{ borderColor: 'var(--line2)' }}>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Mesclar backups</span>
            <span className="text-xs" style={{ color: 'var(--ink3)' }}>Junte os arquivos exportados de outras mesas num relatório único</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>✕</button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-auto p-4.5">
          <input type="file" accept=".json" multiple ref={fileInputRef} onChange={handleFiles} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="h-[46px] rounded-[11px] border text-[13.5px] font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
          >
            {loading ? 'Lendo arquivos...' : 'Selecionar backups (.json) das outras mesas'}
          </button>
          {erro && <span className="text-xs" style={{ color: 'var(--bad)' }}>{erro}</span>}

          {totais && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--ink3)' }}>
                <span>Fontes combinadas:</span>
                {fontes.map((f, i) => (
                  <span key={i} className="rounded-md px-2 py-0.5" style={{ background: 'var(--row)', color: 'var(--ink2)' }}>{f}</span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1 rounded-xl border p-3" style={{ borderColor: 'var(--line)', borderTop: '3px solid var(--ok)' }}>
                  <span className="text-[22px] font-semibold leading-none" style={{ color: 'var(--okInk)' }}>{totais.validos}</span>
                  <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Válidos</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border p-3" style={{ borderColor: 'var(--line)', borderTop: '3px solid var(--bad)' }}>
                  <span className="text-[22px] font-semibold leading-none" style={{ color: 'var(--badInk)' }}>{totais.invalidos}</span>
                  <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Inválidos</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border p-3" style={{ borderColor: 'var(--line)', borderTop: '3px solid var(--ink3)' }}>
                  <span className="text-[22px] font-semibold leading-none" style={{ color: 'var(--ink)' }}>{totais.pendentes}</span>
                  <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Pendentes</span>
                </div>
              </div>

              {conflitos.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border p-3.5" style={{ background: 'var(--badBg)', borderColor: 'var(--badLine)' }}>
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--badInk)' }}>
                    {conflitos.length} atleta(s) checado(s) de forma diferente em mais de uma mesa
                  </span>
                  <div className="flex flex-col gap-2">
                    {conflitos.map(c => (
                      <div key={c.numero_inscricao} className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--ink2)' }}>
                        <span className="font-medium" style={{ color: 'var(--ink)' }}>#{c.numero_inscricao}</span>
                        {c.eventos.map((ev, i) => (
                          <span key={i}>
                            {(ev.device_label || ev.device_id.slice(0, 8))} marcou <strong>{ev.status}</strong> às {new Date(ev.checked_at).toLocaleString('pt-BR')}
                            {i === c.eventos.length - 1 ? ' — venceu (mais recente)' : ''}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => handleExportar('excel')} className="h-[46px] rounded-[11px] text-[13.5px] font-medium text-white" style={{ background: 'var(--accent)' }}>
                  Exportar Excel mesclado
                </button>
                <button onClick={() => handleExportar('pdf')} className="h-[46px] rounded-[11px] border text-[13.5px] font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
                  Exportar PDF mesclado
                </button>
              </div>
            </>
          )}
        </div>

        {totais && (
          <SheetFooter>
            <button
              onClick={() => setConfirmandoAplicar(true)}
              className="h-12 w-full rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--accentLine)', background: 'var(--accentSoft)', color: 'var(--accent)' }}
            >
              Aplicar resultado mesclado neste aparelho
            </button>
          </SheetFooter>
        )}
      </Sheet>

      {confirmandoAplicar && (
        <ConfirmDialog onClose={() => setConfirmandoAplicar(false)} zIndex={50}>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Aplicar mesclagem neste aparelho?</span>
          <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
            A base local deste aparelho vai ser sobrescrita com o resultado combinado das mesas selecionadas. Essa ação não pode ser desfeita.
          </span>
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmandoAplicar(false)} className="h-12 flex-1 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
              Cancelar
            </button>
            <button onClick={handleAplicar} disabled={aplicando} className="h-12 flex-[1.3] rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
              {aplicando ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}
