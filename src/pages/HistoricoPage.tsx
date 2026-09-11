import { useState, useMemo } from 'react'
import type { Athlete } from '../types/athlete'
import { normalizeForSearch } from '../lib/utils'
import { statusStyle, shortCategoria } from '../lib/status'
import { Icon } from '../lib/icons'

interface HistoricoPageProps {
  athletes: Athlete[]
  onRefazer: (athlete: Athlete) => void
}

export function HistoricoPage({ athletes, onRefazer }: HistoricoPageProps) {
  const [query, setQuery] = useState('')
  const q = normalizeForSearch(query)

  const historico = useMemo(() => {
    const validos = athletes.filter(a => a.status === 'valido').length
    const invalidos = athletes.filter(a => a.status === 'invalido').length
    const registros = athletes
      .filter(a => a.status !== 'pendente')
      .filter(a => {
        if (!q) return true
        const h = a.historico[a.historico.length - 1]
        return normalizeForSearch(a.nome).includes(q) ||
          normalizeForSearch(h?.motivo ?? '').includes(q) ||
          normalizeForSearch(h?.operador ?? '').includes(q)
      })
      .sort((a, b) => {
        const ha = a.historico[a.historico.length - 1]?.timestamp || ''
        const hb = b.historico[b.historico.length - 1]?.timestamp || ''
        return hb.localeCompare(ha)
      })
    return { registros, resumo: `${validos} válidos · ${invalidos} inválidos registrados` }
  }, [athletes, q])

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-[46px] items-center gap-2.5 rounded-xl border px-3.5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <Icon name="search" size={16} className="flex-none text-[var(--ink3)]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por atleta ou motivo"
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none"
          style={{ color: 'var(--ink)' }}
        />
      </div>
      <div className="px-0.5 text-[11.5px]" style={{ color: 'var(--ink3)' }}>{historico.resumo}</div>

      <div className="grid grid-cols-1 gap-2.5 min-[900px]:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {historico.registros.map(a => {
          const s = statusStyle(a.status)
          const h = a.historico[a.historico.length - 1]
          const detalhe = a.status === 'invalido'
            ? (h?.motivo || '') + (h?.observacao ? ` — ${h.observacao}` : '')
            : 'Documentação conferida na mesa.'
          return (
            <div key={a.id} className="flex flex-col gap-2 rounded-xl border-l-[3px] border-y border-r p-3.5" style={{ background: 'var(--panel)', borderColor: 'var(--line)', borderLeftColor: s.dot }}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14.5px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{a.nome}</span>
                  <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>#{a.numero_inscricao} · {shortCategoria(a.categoria)}</span>
                </div>
                <span className="flex-none rounded-md px-2.5 py-0.5 text-[11px] font-medium" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
              </div>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>{detalhe}</span>
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>
                  {h?.operador} · {h ? new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <button
                  onClick={() => onRefazer(a)}
                  className="h-9 rounded-[9px] border px-3.5 text-[12.5px] font-medium"
                  style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
                >
                  Refazer
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {historico.registros.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border p-12 text-center" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Nenhum registro no histórico</span>
          <span className="max-w-80 text-[12.5px]" style={{ color: 'var(--ink3)' }}>As checagens feitas aparecem aqui e podem ser desfeitas individualmente.</span>
        </div>
      )}
    </div>
  )
}
