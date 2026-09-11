import { useState } from 'react'
import type { Screen } from '../App'
import type { Athlete } from '../types/athlete'
import type { Stats } from '../hooks/useChecagem'
import type { Filtros } from '../types/filtros'
import type { useSync } from '../hooks/useSync'
import { shortCategoria } from '../lib/status'
import { buildOfficialReport } from '../lib/officialReport'
import { generateReport, openPrintReport } from '../lib/export'

interface PainelPageProps {
  stats: Stats
  athletes: Athlete[]
  onNavigate: (s: Screen, filtroPatch?: Partial<Filtros>) => void
  sync: ReturnType<typeof useSync>
}

const RING_R = 31
const RING_C = 2 * Math.PI * RING_R

export function PainelPage({ stats, athletes, onNavigate, sync }: PainelPageProps) {
  const [lancarMsg, setLancarMsg] = useState('')
  const [exportMsg, setExportMsg] = useState('')
  const oficialAtivo = sync.isSupabaseConfigured && sync.rawEvents !== null
  const oficial = oficialAtivo ? buildOfficialReport(athletes, sync.rawEvents!) : null
  const { total, validos, invalidos, pendentes, checados, pct } = stats
  const anelOffset = Math.round(RING_C - (RING_C * pct) / 100)
  const pctValidos = total ? (validos / total) * 100 : 0
  const pctInvalidos = total ? (invalidos / total) * 100 : 0

  const kpis = [
    { label: 'Válidos', valor: validos, fg: 'var(--okInk)', bar: 'var(--ok)', status: 'valido' as const },
    { label: 'Inválidos', valor: invalidos, fg: 'var(--badInk)', bar: 'var(--bad)', status: 'invalido' as const },
    { label: 'Pendentes', valor: pendentes, fg: 'var(--ink)', bar: 'var(--ink3)', status: 'pendente' as const },
  ]

  const categorias = Array.from(new Set(athletes.map(a => a.categoria).filter(Boolean) as string[])).sort()
  const porCategoria = categorias.map(cat => {
    const grupo = athletes.filter(a => a.categoria === cat)
    const ch = grupo.filter(a => a.status !== 'pendente').length
    return { cat, label: `${ch} / ${grupo.length}`, pct: grupo.length ? Math.round((ch / grupo.length) * 100) : 0 }
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-[minmax(340px,1.1fr)_minmax(300px,1fr)]">

        {/* Hero */}
        <div className="flex items-center gap-4 rounded-2xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="relative flex h-24 w-24 flex-none items-center justify-center">
            <svg width={96} height={96} viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={36} cy={36} r={RING_R} fill="none" stroke="var(--row)" strokeWidth={8} />
              <circle
                cx={36} cy={36} r={RING_R} fill="none" stroke="var(--accent)" strokeWidth={8} strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={anelOffset}
                style={{ transition: 'stroke-dashoffset .6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>{pct}%</span>
              <span className="mt-0.5 text-[10px]" style={{ color: 'var(--ink3)' }}>checado</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>
                {checados}<span className="text-[15px] font-medium" style={{ color: 'var(--ink3)' }}> / {total}</span>
              </span>
              <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>atletas passaram pela mesa</span>
            </div>
            <div className="flex h-[7px] overflow-hidden rounded-full" style={{ background: 'var(--row)' }}>
              <div className="h-full" style={{ background: 'var(--ok)', width: `${pctValidos}%` }} />
              <div className="h-full" style={{ background: 'var(--bad)', width: `${pctInvalidos}%` }} />
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink2)' }}>
                <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--ok)' }} />{validos} válidos
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink2)' }}>
                <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--bad)' }} />{invalidos} inválidos
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink2)' }}>
                <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--row)' }} />{pendentes} pendentes
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {kpis.map(k => (
            <button
              key={k.label}
              onClick={() => onNavigate('busca', { status: k.status })}
              className="flex flex-col items-start gap-1 rounded-xl border p-3 text-left"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)', borderTop: `3px solid ${k.bar}` }}
            >
              <span className="text-[22px] font-semibold leading-none tracking-tight" style={{ color: k.fg }}>{k.valor}</span>
              <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>{k.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listagem principal — resultado combinado das 4 mesas */}
      {sync.isSupabaseConfigured && (
        <div className="flex flex-col gap-3 rounded-xl border p-4" style={{ background: 'var(--accentSoft)', borderColor: 'var(--accentLine)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: sync.connected ? 'var(--ok)' : 'var(--ink3)' }} />
              <span className="text-[13.5px] font-semibold" style={{ color: 'var(--accent)' }}>Listagem principal — todas as mesas</span>
            </div>
            {sync.pendingCount > 0 && (
              <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>{sync.pendingCount} desta mesa aguardando envio</span>
            )}
          </div>

          {oficial ? (
            <>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
                  <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--ok)' }} />{sync.combinedStats?.validos ?? 0} válidos
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
                  <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--bad)' }} />{sync.combinedStats?.invalidos ?? 0} inválidos
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
                  {sync.combinedStats?.checados ?? 0} checados no total
                </span>
              </div>

              {oficial.conflitos.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border p-3.5" style={{ background: 'var(--badBg)', borderColor: 'var(--badLine)' }}>
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--badInk)' }}>
                    {oficial.conflitos.length} atleta(s) com resposta diferente entre mesas — vira observação no relatório
                  </span>
                  {oficial.conflitos.slice(0, 5).map(c => (
                    <span key={c.numero_inscricao} className="text-[12px]" style={{ color: 'var(--ink2)' }}>
                      <strong style={{ color: 'var(--ink)' }}>#{c.numero_inscricao}</strong> — {c.eventos.map(e => `${e.device_label || 'aparelho'}: ${e.status}`).join(' vs ')}
                    </span>
                  ))}
                  {oficial.conflitos.length > 5 && (
                    <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>+ {oficial.conflitos.length - 5} outro(s)</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <span className="text-[12.5px]" style={{ color: 'var(--ink3)' }}>Ainda sem dados de outras mesas — lance o histórico ou aguarde a conexão.</span>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={async () => {
                setLancarMsg('')
                const r = await sync.syncNow()
                setLancarMsg(r.ok ? (r.sent > 0 ? `${r.sent} checagem(ns) lançada(s).` : 'Tudo já estava enviado.') : 'Erro ao lançar — verifique a conexão.')
              }}
              disabled={sync.syncing}
              className="h-[46px] rounded-[11px] text-[13.5px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {sync.syncing ? 'Lançando...' : 'Lançar histórico'}
            </button>
            <button
              onClick={() => oficial && generateReport(oficial.atletas)}
              disabled={!oficial}
              className="h-[46px] rounded-[11px] border text-[13.5px] font-medium disabled:opacity-50"
              style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
            >
              Exportar Excel
            </button>
          </div>
          <button
            onClick={() => {
              if (!oficial) return
              const ok = openPrintReport(oficial.atletas)
              setExportMsg(ok ? '' : 'Pop-up bloqueado — o relatório foi baixado como arquivo. Abra-o e use Imprimir > Salvar como PDF.')
            }}
            disabled={!oficial}
            className="h-[46px] rounded-[11px] border text-[13.5px] font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
          >
            Exportar PDF
          </button>
          {lancarMsg && <span className="text-xs" style={{ color: lancarMsg.startsWith('Erro') ? 'var(--bad)' : 'var(--ok)' }}>{lancarMsg}</span>}
          {exportMsg && <span className="text-xs" style={{ color: 'var(--ink2)' }}>{exportMsg}</span>}
          <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>A listagem principal é só leitura — não muda o que aparece na sua mesa</span>
        </div>
      )}

      {/* Avanço por modalidade */}
      <div className="overflow-hidden rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="border-b px-4 py-3 text-[13.5px] font-semibold" style={{ borderColor: 'var(--line2)', color: 'var(--ink)' }}>
          Avanço por modalidade
        </div>
        {porCategoria.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--ink3)' }}>Nenhum atleta importado ainda.</div>
        )}
        {porCategoria.map(c => (
          <button
            key={c.cat}
            onClick={() => onNavigate('busca', { categoria: c.cat, status: 'todos' })}
            className="flex min-h-13 w-full flex-col gap-1.5 border-b px-4 py-2.5 text-left"
            style={{ borderColor: 'var(--line2)' }}
          >
            <span className="flex w-full items-center justify-between gap-2.5">
              <span className="text-[12.5px]" style={{ color: 'var(--ink2)' }}>{shortCategoria(c.cat)}</span>
              <span className="flex-none text-xs font-semibold" style={{ color: 'var(--ink)' }}>{c.label}</span>
            </span>
            <span className="h-[5px] w-full overflow-hidden rounded-full" style={{ background: 'var(--row)' }}>
              <span className="block h-full rounded-full" style={{ background: 'var(--accent)', width: `${c.pct}%` }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
