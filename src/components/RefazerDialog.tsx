import { ConfirmDialog } from './ConfirmDialog'
import type { Athlete } from '../types/athlete'
import { statusStyle } from '../lib/status'

interface RefazerDialogProps {
  athlete: Athlete
  onCancel: () => void
  onConfirm: () => void
}

export function RefazerDialog({ athlete: a, onCancel, onConfirm }: RefazerDialogProps) {
  const lastCheck = a.historico[a.historico.length - 1]
  const s = statusStyle(a.status)
  const detalhe = a.status === 'invalido'
    ? (lastCheck?.observacao || 'Sem observação registrada')
    : 'Documentação conferida na mesa.'
  const assinatura = lastCheck ? `${lastCheck.operador} · ${new Date(lastCheck.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—'

  return (
    <ConfirmDialog onClose={onCancel}>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Refazer checagem</span>
        <span className="text-xs" style={{ color: 'var(--ink3)' }}>{a.nome} · #{a.numero_inscricao}</span>
      </div>
      <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
        O registro será apagado do histórico e o atleta volta para <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>pendente</strong>. A ação não pode ser desfeita.
      </span>
      <div className="flex flex-col gap-1.5 rounded-xl border p-3.5" style={{ borderColor: 'var(--line)', background: 'var(--soft)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md px-2.5 py-1 text-[11px] font-medium" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
          <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>{assinatura}</span>
        </div>
        <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>{detalhe}</span>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="h-12 flex-1 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
          Cancelar
        </button>
        <button onClick={onConfirm} className="h-12 flex-[1.3] rounded-xl text-sm font-medium text-white" style={{ background: 'var(--bad)' }}>
          Apagar e refazer
        </button>
      </div>
    </ConfirmDialog>
  )
}
