import { useState } from 'react'
import { Sheet, SheetFooter } from './Sheet'
import { INVALIDATION_REASONS, type InvalidationReason } from '../types/athlete'

interface InvalidarSheetProps {
  athleteName: string
  onConfirm: (motivo: InvalidationReason, observacao: string) => void
  onCancel: () => void
}

export function InvalidarSheet({ athleteName, onConfirm, onCancel }: InvalidarSheetProps) {
  const [motivo, setMotivo] = useState<InvalidationReason | null>(null)
  const [obs, setObs] = useState('')

  const isOutro = motivo === 'Outro'
  const podeConfirmar = motivo !== null && (!isOutro || obs.trim().length > 0)

  return (
    <Sheet onClose={onCancel} zIndex={40}>
      <div className="flex items-center justify-between gap-3 border-b px-4.5 py-3.5" style={{ borderColor: 'var(--line2)' }}>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Invalidar atleta</span>
          <span className="truncate text-xs" style={{ color: 'var(--ink3)' }}>{athleteName}</span>
        </div>
        <button onClick={onCancel} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>✕</button>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-auto p-4.5">
        <span className="text-[12.5px] font-medium" style={{ color: 'var(--ink2)' }}>Motivo</span>
        <div className="flex flex-col gap-1.5">
          {INVALIDATION_REASONS.map(m => {
            const ativo = motivo === m
            return (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 text-left"
                style={{
                  border: ativo ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                  background: ativo ? 'var(--accentSoft)' : 'var(--panel)',
                }}
              >
                <span
                  className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full"
                  style={{ border: `1.5px solid ${ativo ? 'var(--accent)' : 'var(--ink3)'}` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: ativo ? 'var(--accent)' : 'transparent' }} />
                </span>
                <span className="text-[13px] leading-tight" style={{ color: 'var(--ink2)' }}>{m}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-medium" style={{ color: 'var(--ink2)' }}>Observação</span>
            <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>{obs.length} caracteres</span>
          </div>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Detalhe o que foi observado na checagem"
            className="h-[86px] resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
          />
          {isOutro && !obs.trim() && (
            <span className="text-[11.5px]" style={{ color: 'var(--bad)' }}>Obrigatória para o motivo "Outro".</span>
          )}
        </div>
      </div>

      <SheetFooter>
        <button onClick={onCancel} className="h-[50px] flex-1 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
          Cancelar
        </button>
        <button
          onClick={() => motivo && podeConfirmar && onConfirm(motivo, obs.trim())}
          disabled={!podeConfirmar}
          className="h-[50px] flex-[1.4] rounded-xl text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--bad)' }}
        >
          Confirmar
        </button>
      </SheetFooter>
    </Sheet>
  )
}
