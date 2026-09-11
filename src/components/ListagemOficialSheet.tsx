import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import type { Athlete, AthleteStatus } from '../types/athlete'
import { normalizeForSearch } from '../lib/utils'
import { statusStyle, shortCategoria } from '../lib/status'
import { Icon } from '../lib/icons'

interface ListagemOficialSheetProps {
  atletas: Athlete[]
  onClose: () => void
}

type FiltroStatus = 'checados' | 'todos' | AthleteStatus

const CHIPS: { key: FiltroStatus; label: string }[] = [
  { key: 'checados', label: 'Lançados' },
  { key: 'valido', label: 'Válidos' },
  { key: 'invalido', label: 'Desclassificados' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'todos', label: 'Todos' },
]

export function ListagemOficialSheet({ atletas, onClose }: ListagemOficialSheetProps) {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('checados')
  const q = normalizeForSearch(query)

  const registros = useMemo(() => {
    return atletas
      .filter(a => {
        if (filtro === 'checados') return a.status !== 'pendente'
        if (filtro !== 'todos') return a.status === filtro
        return true
      })
      .filter(a => {
        if (!q) return true
        return normalizeForSearch(a.nome).includes(q) || a.numero_inscricao.includes(query.trim())
      })
      .sort((a, b) => {
        const ha = a.historico[a.historico.length - 1]?.timestamp || ''
        const hb = b.historico[b.historico.length - 1]?.timestamp || ''
        if (ha !== hb) return hb.localeCompare(ha)
        return a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true })
      })
  }, [atletas, filtro, q, query])

  const totalLancados = atletas.filter(a => a.status !== 'pendente').length

  return (
    <Sheet onClose={onClose} wide zIndex={40}>
      <div className="flex items-center justify-between border-b px-4.5 py-3.5" style={{ borderColor: 'var(--line2)' }}>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Listagem principal — todos os aparelhos</span>
          <span className="text-xs" style={{ color: 'var(--ink3)' }}>{totalLancados} checagem(ns) já lançada(s) e combinada(s)</span>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>✕</button>
      </div>

      <div className="flex flex-col gap-2.5 border-b px-4.5 py-3" style={{ borderColor: 'var(--line2)' }}>
        <div className="flex h-[44px] items-center gap-2.5 rounded-xl border px-3.5" style={{ borderColor: 'var(--line)', background: 'var(--field)' }}>
          <Icon name="search" size={16} className="flex-none text-[var(--ink3)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Número de peito ou nome"
            inputMode="numeric"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none"
            style={{ color: 'var(--ink)' }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {CHIPS.map(c => (
            <button
              key={c.key}
              onClick={() => setFiltro(c.key)}
              className="flex-none rounded-lg px-3 py-1.5 text-[12.5px] font-medium"
              style={filtro === c.key
                ? { background: 'var(--accentSoft)', color: 'var(--accent)' }
                : { background: 'var(--row)', color: 'var(--ink2)' }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-auto p-4.5">
        {registros.map(a => {
          const s = statusStyle(a.status)
          const h = a.historico[a.historico.length - 1]
          const isConflito = !!h?.observacao?.startsWith('⚠')
          return (
            <div
              key={a.numero_inscricao}
              className="flex flex-col gap-1.5 rounded-xl border-l-[3px] border-y border-r p-3.5"
              style={{
                background: isConflito ? 'var(--badBg)' : 'var(--panel)',
                borderColor: isConflito ? 'var(--badLine)' : 'var(--line)',
                borderLeftColor: s.dot,
              }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{a.nome}</span>
                  <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>#{a.numero_inscricao} · {shortCategoria(a.categoria)}</span>
                </div>
                <span className="flex-none rounded-md px-2.5 py-0.5 text-[11px] font-medium" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
              </div>
              {h && (
                <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>
                  {h.operador} · {new Date(h.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {h?.observacao && (
                <span className="text-[12px] leading-relaxed" style={{ color: isConflito ? 'var(--badInk)' : 'var(--ink2)' }}>{h.observacao}</span>
              )}
            </div>
          )
        })}

        {registros.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border p-12 text-center" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Nenhum registro encontrado</span>
            <span className="max-w-80 text-[12.5px]" style={{ color: 'var(--ink3)' }}>Lance o histórico deste aparelho ou aguarde a conexão para ver os dados combinados.</span>
          </div>
        )}
      </div>
    </Sheet>
  )
}
