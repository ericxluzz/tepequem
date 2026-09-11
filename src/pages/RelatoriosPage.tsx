import { useState } from 'react'
import type { Athlete } from '../types/athlete'
import type { Stats } from '../hooks/useChecagem'
import type { useSync } from '../hooks/useSync'
import { generateReport, openPrintReport } from '../lib/export'

interface RelatoriosPageProps {
  stats: Stats
  athletes: Athlete[]
  sync: ReturnType<typeof useSync>
}

type Formato = 'excel' | 'pdf'
type Escopo = 'todos' | 'checados'

export function RelatoriosPage({ stats, athletes, sync }: RelatoriosPageProps) {
  const [formato, setFormato] = useState<Formato>('excel')
  const [escopo, setEscopo] = useState<Escopo>('todos')
  const [incluirObs, setIncluirObs] = useState(true)
  const [incluirContato, setIncluirContato] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportacoes, setExportacoes] = useState<string[]>([])
  const [lancarMsg, setLancarMsg] = useState('')

  async function handleLancar() {
    setLancarMsg('')
    const r = await sync.syncNow()
    setLancarMsg(r.ok ? (r.sent > 0 ? `${r.sent} checagem(ns) lançada(s) para a listagem principal.` : 'Tudo já estava enviado.') : 'Erro ao lançar — verifique a conexão.')
  }

  const formatos: { id: Formato; titulo: string; sub: string }[] = [
    { id: 'excel', titulo: 'Excel', sub: 'Planilha formatada' },
    { id: 'pdf', titulo: 'PDF', sub: 'A4 paisagem, pronto para imprimir' },
  ]
  const escopos: { id: Escopo; titulo: string; sub: string }[] = [
    { id: 'todos', titulo: 'Todos os atletas', sub: `${stats.total} registros` },
    { id: 'checados', titulo: 'Apenas checados', sub: `${stats.checados} registros` },
  ]

  async function handleExport() {
    setLoading(true)
    try {
      const alvo = escopo === 'checados' ? athletes.filter(a => a.status !== 'pendente') : athletes
      const options = { incluirObs, incluirContato }
      const carimbo = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (formato === 'excel') {
        await generateReport(alvo, options)
        setExportacoes(prev => [`Excel ${carimbo} · ${alvo.length} registros`, ...prev].slice(0, 6))
      } else {
        const ok = openPrintReport(alvo, options)
        setExportacoes(prev => [`PDF ${carimbo} · ${alvo.length} registros` + (ok ? '' : ' (baixado como arquivo — abra e use Imprimir > Salvar como PDF)'), ...prev].slice(0, 6))
      }
    } finally {
      setLoading(false)
    }
  }

  const extras: { key: 'incluirObs' | 'incluirContato'; titulo: string; on: boolean; toggle: () => void }[] = [
    { key: 'incluirObs', titulo: 'Incluir observações da mesa', on: incluirObs, toggle: () => setIncluirObs(v => !v) },
    { key: 'incluirContato', titulo: 'Incluir telefone e e-mail', on: incluirContato, toggle: () => setIncluirContato(v => !v) },
  ]

  return (
    <div className="grid grid-cols-1 items-start gap-3 min-[900px]:grid-cols-[repeat(auto-fit,minmax(330px,1fr))]">
      <div className="flex flex-col gap-3.5 rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>

        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Formato</span>
          <div className="grid grid-cols-2 gap-2">
            {formatos.map(f => {
              const ativo = formato === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className="flex min-h-[74px] flex-col gap-1 rounded-[11px] p-3.5 text-left"
                  style={ativo
                    ? { border: '1.5px solid var(--accent)', background: 'var(--accentSoft)' }
                    : { border: '1px solid var(--line)', background: 'var(--panel)' }}
                >
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{f.titulo}</span>
                  <span className="text-[11.5px] leading-snug" style={{ color: 'var(--ink3)' }}>{f.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Conteúdo</span>
          {escopos.map(e => {
            const ativo = escopo === e.id
            return (
              <button
                key={e.id}
                onClick={() => setEscopo(e.id)}
                className="flex min-h-13 items-center gap-2.5 rounded-[10px] p-3 text-left"
                style={ativo
                  ? { border: '1.5px solid var(--accent)', background: 'var(--accentSoft)' }
                  : { border: '1px solid var(--line)', background: 'var(--panel)' }}
              >
                <span
                  className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] text-[11px]"
                  style={{ background: ativo ? 'var(--accent)' : 'var(--field)', border: `1.5px solid ${ativo ? 'var(--accent)' : 'var(--ink3)'}`, color: 'var(--onAccent)' }}
                >{ativo ? '✓' : ''}</span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{e.titulo}</span>
                  <span className="text-[11.5px]" style={{ color: 'var(--ink3)' }}>{e.sub}</span>
                </span>
              </button>
            )
          })}
          {extras.map(o => (
            <button
              key={o.key}
              onClick={o.toggle}
              className="flex min-h-12 items-center gap-2.5 rounded-[10px] border p-3 text-left"
              style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
            >
              <span
                className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] text-[11px]"
                style={{ background: o.on ? 'var(--accent)' : 'var(--field)', border: `1.5px solid ${o.on ? 'var(--accent)' : 'var(--ink3)'}`, color: 'var(--onAccent)' }}
              >{o.on ? '✓' : ''}</span>
              <span className="text-[13px]" style={{ color: 'var(--ink2)' }}>{o.titulo}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={loading || stats.total === 0}
          className="h-12 rounded-[11px] text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--onAccent)' }}
        >
          {loading ? 'Gerando...' : formato === 'excel' ? 'Baixar planilha Excel' : 'Abrir PDF para salvar'}
        </button>

        {sync.isSupabaseConfigured && (
          <>
            <button
              onClick={handleLancar}
              disabled={sync.syncing}
              className="h-12 rounded-[11px] border text-sm font-medium disabled:opacity-50"
              style={{ borderColor: 'var(--accentLine)', background: 'var(--accentSoft)', color: 'var(--accent)' }}
            >
              {sync.syncing ? 'Lançando...' : 'Lançar relatório para a listagem principal'}
            </button>
            {lancarMsg && <span className="text-xs" style={{ color: lancarMsg.startsWith('Erro') ? 'var(--bad)' : 'var(--ok)' }}>{lancarMsg}</span>}
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="border-b px-4 py-3 text-[13.5px] font-semibold" style={{ borderColor: 'var(--line2)', color: 'var(--ink)' }}>
          Histórico desta sessão
        </div>
        {exportacoes.length === 0 ? (
          <div className="px-4 py-6.5 text-center text-[12.5px]" style={{ color: 'var(--ink3)' }}>Nenhum relatório gerado ainda.</div>
        ) : (
          exportacoes.map((x, i) => (
            <div key={i} className="flex items-center gap-2.5 border-b px-4 py-3 text-[12.5px] leading-relaxed" style={{ borderColor: 'var(--line2)', color: 'var(--ink2)' }}>
              <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: 'var(--ink3)' }} />
              {x}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
