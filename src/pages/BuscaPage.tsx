import { useState, useMemo } from 'react'
import type { Athlete } from '../types/athlete'
import type { Filtros, FiltroStatus } from '../types/filtros'
import { normalizeForSearch } from '../lib/utils'
import { statusStyle, shortCategoria } from '../lib/status'
import { Icon } from '../lib/icons'

interface BuscaPageProps {
  athletes: Athlete[]
  filtros: Filtros
  onFiltrosChange: (f: Filtros) => void
  categorias: string[]
  onAbrirFiltros: () => void
  filtrosAtivos: boolean
  onSelect: (id: number) => void
}

const ORDENAR: Record<Filtros['ordem'], (a: Athlete, b: Athlete) => number> = {
  'Nome (A–Z)': (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
  'Nome (Z–A)': (a, b) => b.nome.localeCompare(a.nome, 'pt-BR'),
  'Nº de inscrição': (a, b) => a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true }),
  'Checagem recente': (a, b) => {
    const ha = a.historico[a.historico.length - 1]?.timestamp || ''
    const hb = b.historico[b.historico.length - 1]?.timestamp || ''
    return hb.localeCompare(ha)
  },
}

const CHIPS: { key: FiltroStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'valido', label: 'Válidos' },
  { key: 'invalido', label: 'Inválidos' },
]

export function BuscaPage({ athletes, filtros, onFiltrosChange, onAbrirFiltros, filtrosAtivos, onSelect }: BuscaPageProps) {
  const [limite, setLimite] = useState(30)
  const q = normalizeForSearch(filtros.query)

  const contagens = useMemo(() => ({
    todos: athletes.length,
    pendente: athletes.filter(a => a.status === 'pendente').length,
    valido: athletes.filter(a => a.status === 'valido').length,
    invalido: athletes.filter(a => a.status === 'invalido').length,
  }), [athletes])

  // dígitos puros (sem "#" nem espaços) -> busca é sempre pelo número de peito
  const numQuery = filtros.query.replace(/\D/g, '')
  const isNumQuery = numQuery.length > 0 && numQuery === filtros.query.replace(/[#\s]/g, '')
  const numQueryValue = isNumQuery ? parseInt(numQuery, 10) : null
  const numQueryStripped = numQuery.replace(/^0+/, '') || '0'
  // se o número bater exatamente com o peito de alguém (com ou sem zero à
  // esquerda), a busca isola só essa pessoa em vez de mostrar prefixos (026, 260, 261...)
  const numExactMatch = isNumQuery && athletes.some(a => parseInt(a.numero_inscricao, 10) === numQueryValue)

  const lista = useMemo(() => {
    let l = athletes.filter(a => {
      if (filtros.status !== 'todos' && a.status !== filtros.status) return false
      if (filtros.categoria !== 'Todas' && a.categoria !== filtros.categoria) return false
      if (filtros.sexo !== 'Todos' && a.sexo !== filtros.sexo) return false
      if (filtros.uf !== 'Todas' && a.uf !== filtros.uf) return false
      if (filtros.equipe !== 'Todas' && a.equipe !== filtros.equipe) return false
      if (!q) return true
      if (isNumQuery) {
        if (numExactMatch) return parseInt(a.numero_inscricao, 10) === numQueryValue
        const numStripped = a.numero_inscricao.replace(/^0+/, '') || '0'
        return numStripped.startsWith(numQueryStripped)
      }
      return (a._search ?? '').includes(q)
    })
    l = [...l].sort(ORDENAR[filtros.ordem])
    if (isNumQuery) {
      l.sort((a, b) => a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true }))
    } else if (q) {
      l.sort((a, b) => {
        const ai = normalizeForSearch(a.nome).indexOf(q), bi = normalizeForSearch(b.nome).indexOf(q)
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })
    }
    return l
  }, [athletes, filtros, q, isNumQuery, numExactMatch, numQueryValue, numQueryStripped])

  function setQuery(query: string) {
    onFiltrosChange({ ...filtros, query })
    setLimite(30)
  }
  function setStatus(status: FiltroStatus) {
    onFiltrosChange({ ...filtros, status })
    setLimite(30)
  }

  const visiveis = lista.slice(0, limite)

  return (
    <div className="flex flex-col gap-2.5">
      {/* Busca + filtros */}
      <div className="flex items-center gap-2">
        <div className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
          <Icon name="search" size={16} className="flex-none text-[var(--ink3)]" />
          <input
            value={filtros.query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou número de peito"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none"
            style={{ color: 'var(--ink)' }}
          />
          {filtros.query && (
            <button onClick={() => setQuery('')} className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-full text-[13px]" style={{ background: 'var(--row)', color: 'var(--ink3)' }}>✕</button>
          )}
        </div>
        <button
          onClick={onAbrirFiltros}
          className="flex h-[46px] flex-none items-center gap-2 rounded-xl px-3.5 text-sm font-medium"
          style={filtrosAtivos
            ? { background: 'var(--accentSoft)', color: 'var(--accent)', border: '1px solid var(--accentLine)' }
            : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink2)' }}
        >
          <Icon name="filter" size={17} />
          <span className="hidden min-[900px]:inline">Filtros</span>
          {filtrosAtivos && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--onAccent)' }}>
              {[filtros.categoria !== 'Todas', filtros.sexo !== 'Todos', filtros.uf !== 'Todas', filtros.equipe !== 'Todas'].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {CHIPS.map(c => {
          const ativo = filtros.status === c.key
          return (
            <button
              key={c.key}
              onClick={() => setStatus(c.key)}
              className="h-[38px] flex-none whitespace-nowrap rounded-[10px] px-3.5 text-[13px] font-medium"
              style={ativo
                ? { background: 'var(--accentSoft)', color: 'var(--accent)', border: '1px solid var(--accentLine)' }
                : { background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink2)' }}
            >
              {c.label} · {contagens[c.key]}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-2.5 min-[900px]:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {visiveis.map(a => {
          const s = statusStyle(a.status)
          const lastCheck = a.historico[a.historico.length - 1]
          return (
            <button
              key={a.id}
              onClick={() => a.id != null && onSelect(a.id)}
              className="flex min-h-[96px] flex-col gap-2 rounded-xl border-l-[3px] border-y border-r p-3.5 text-left"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)', borderLeftColor: s.dot }}
            >
              <span className="flex w-full items-start justify-between gap-2.5">
                <span className="min-w-0 text-[15px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{a.nome}</span>
                <span className="flex-none rounded-md px-2.5 py-0.5 text-[11px] font-medium" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
              </span>
              <span className="flex w-full flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--ink2)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>#{a.numero_inscricao}</span>
                <span style={{ color: 'var(--ink3)' }}>·</span>
                <span>{shortCategoria(a.categoria)}</span>
              </span>
              <span className="flex w-full items-center justify-between gap-2.5 text-[11.5px]" style={{ color: 'var(--ink3)' }}>
                <span className="min-w-0 truncate">{[a.equipe, a.uf].filter(Boolean).join(' · ') || '—'}</span>
                <span className="flex-none">
                  {lastCheck ? new Date(lastCheck.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Aguardando'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {athletes.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border p-12 text-center" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Nenhuma base importada</span>
          <span className="max-w-80 text-[12.5px]" style={{ color: 'var(--ink3)' }}>Acesse Ajustes para importar a planilha de atletas.</span>
        </div>
      )}
      {athletes.length > 0 && lista.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border p-12 text-center" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Nenhum atleta encontrado</span>
          <span className="max-w-80 text-[12.5px]" style={{ color: 'var(--ink3)' }}>Ajuste os filtros ou busque pelo número de peito, nome, apelido, CPF, e-mail, telefone ou equipe.</span>
        </div>
      )}
      {lista.length > limite && (
        <button
          onClick={() => setLimite(l => l + 30)}
          className="h-[46px] rounded-xl border text-sm font-medium"
          style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
        >
          Carregar mais atletas
        </button>
      )}
      {lista.length > 0 && (
        <div className="px-0.5 pb-1 pt-0.5 text-center text-[11.5px]" style={{ color: 'var(--ink3)' }}>
          {Math.min(limite, lista.length)} de {lista.length} atletas
        </div>
      )}
    </div>
  )
}
