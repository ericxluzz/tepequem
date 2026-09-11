import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

interface ZerarDialogProps {
  checados: number
  total: number
  onCancel: () => void
  onConfirm: () => void
}

export function ZerarDialog({ checados, total, onCancel, onConfirm }: ZerarDialogProps) {
  const [texto, setTexto] = useState('')
  const ok = texto.trim().toUpperCase() === 'CONFIRMAR'

  return (
    <ConfirmDialog onClose={onCancel}>
      <span className="text-base font-semibold" style={{ color: 'var(--badInk)' }}>Zerar todas as checagens</span>
      <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
        As {checados} checagens registradas serão descartadas e os {total} atletas voltam para pendente.
      </span>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>Digite CONFIRMAR para continuar</span>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          className="h-12 rounded-xl border px-3.5 text-sm outline-none"
          style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
        />
      </div>
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="h-12 flex-1 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
          Cancelar
        </button>
        <button
          onClick={() => ok && onConfirm()}
          disabled={!ok}
          className="h-12 flex-[1.3] rounded-xl text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--bad)' }}
        >
          Zerar
        </button>
      </div>
    </ConfirmDialog>
  )
}
