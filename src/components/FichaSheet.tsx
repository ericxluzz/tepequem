import { Sheet, SheetFooter } from './Sheet'
import type { Athlete } from '../types/athlete'
import { statusStyle } from '../lib/status'
import { formatDate } from '../lib/utils'

interface FichaSheetProps {
  athlete: Athlete
  onClose: () => void
  onConfirmar: () => void
  onAbrirInvalidar: () => void
  onAbrirRefazer: () => void
}

export function FichaSheet({ athlete: a, onClose, onConfirmar, onAbrirInvalidar, onAbrirRefazer }: FichaSheetProps) {
  const s = statusStyle(a.status)
  const lastCheck = a.historico[a.historico.length - 1]
  const idade = a.idade_calculada ? `${a.idade_calculada} anos` : '—'

  const campos: { k: string; v: string }[] = [
    { k: 'Inscrição', v: `#${a.numero_inscricao}` },
    { k: 'CPF', v: a.cpf || '—' },
    { k: 'Nascimento', v: formatDate(a.data_nascimento) },
    { k: 'Sexo', v: a.sexo || '—' },
    { k: 'Telefone', v: a.telefone || '—' },
    { k: 'E-mail', v: a.email || '—' },
    { k: 'UF', v: a.uf || '—' },
    { k: 'Equipe', v: a.equipe || '—' },
    { k: 'Como quer ser chamado', v: a.apelido || '—' },
    { k: 'Camiseta', v: a.tamanho_camiseta || '—' },
    { k: 'Modalidade', v: a.categoria || '—' },
    { k: 'Idade na prova', v: idade },
  ]

  return (
    <Sheet onClose={onClose} wide zIndex={35}>
      <div className="flex items-start justify-between gap-3 border-b px-4.5 py-4" style={{ borderColor: 'var(--line2)' }}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md px-2.5 py-1 text-[11px] font-medium" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>#{a.numero_inscricao}</span>
          </div>
          <span className="text-xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{a.nome}</span>
          <span className="text-[12.5px] leading-tight" style={{ color: 'var(--ink3)' }}>{a.categoria || 'Sem categoria'} · {idade}</span>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>✕</button>
      </div>

      <div className="grid flex-1 content-start grid-cols-2 gap-x-4 gap-y-3.5 overflow-auto p-4.5 min-[900px]:grid-cols-4">
        {campos.map(c => (
          <div key={c.k} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>{c.k}</span>
            <span className="break-words text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>{c.v}</span>
          </div>
        ))}
        {a.status === 'invalido' && lastCheck?.motivo && (
          <div className="col-span-full flex flex-col gap-1 rounded-xl border p-3.5" style={{ background: 'var(--badBg)', borderColor: 'var(--badLine)' }}>
            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--badInk)' }}>{lastCheck.motivo}</span>
            <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>{lastCheck.observacao || 'Sem observação registrada'}</span>
          </div>
        )}
      </div>

      {a.status === 'pendente' ? (
        <SheetFooter>
          <button onClick={onAbrirInvalidar} className="h-[54px] flex-1 rounded-xl border text-[15px] font-medium" style={{ borderColor: 'var(--badLine)', background: 'var(--panel)', color: 'var(--bad)' }}>
            Invalidar
          </button>
          <button onClick={onConfirmar} className="h-[54px] flex-[1.5] rounded-xl text-[15px] font-medium text-white" style={{ background: 'var(--ok)' }}>
            Confirmar atleta
          </button>
        </SheetFooter>
      ) : (
        <div className="flex flex-col gap-2.5 border-t px-4.5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-[900px]:pb-3" style={{ borderColor: 'var(--line2)' }}>
          <span className="text-xs" style={{ color: 'var(--ink3)' }}>
            {(a.status === 'valido' ? 'Confirmado por ' : 'Invalidado por ') + (lastCheck?.operador || '—') + ' às ' + (lastCheck ? new Date(lastCheck.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—')}
          </span>
          <button onClick={onAbrirRefazer} className="h-12 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
            Refazer checagem
          </button>
        </div>
      )}
    </Sheet>
  )
}
