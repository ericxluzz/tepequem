import { useState, useEffect, useCallback } from 'react'
import { getSetting, setSetting } from './db/database'
import { useChecagem } from './hooks/useChecagem'
import { useSync } from './hooks/useSync'
import type { Athlete } from './types/athlete'
import { FILTROS_VAZIOS, type Filtros } from './types/filtros'
import { Icon, type IconName } from './lib/icons'
import { PainelPage } from './pages/PainelPage'
import { BuscaPage } from './pages/BuscaPage'
import { HistoricoPage } from './pages/HistoricoPage'
import { RelatoriosPage } from './pages/RelatoriosPage'
import { ConfigPage } from './pages/ConfigPage'
import { FiltrosSheet } from './components/FiltrosSheet'
import { FichaSheet } from './components/FichaSheet'
import { RefazerDialog } from './components/RefazerDialog'
import { ZerarDialog } from './components/ZerarDialog'
import { FeedbackOverlay, type FeedbackData } from './components/FeedbackOverlay'
import { Toast, type ToastTipo } from './components/Toast'
import { InstallBanner } from './components/InstallBanner'

export type Screen = 'painel' | 'busca' | 'historico' | 'relatorios' | 'config'
type Modal = 'filtros' | 'ficha' | 'refazer' | 'zerar' | null

const NAV: { k: Screen; label: string; icon: IconName }[] = [
  { k: 'painel', label: 'Painel', icon: 'painel' },
  { k: 'busca', label: 'Atletas', icon: 'atletas' },
  { k: 'historico', label: 'Histórico', icon: 'historico' },
  { k: 'relatorios', label: 'Exportar', icon: 'relatorios' },
  { k: 'config', label: 'Ajustes', icon: 'config' },
]

export default function App() {
  const checagem = useChecagem()
  const { athletes, stats, categorias, ufs, equipes, confirmar, invalidar, refazer, zerarTudo } = checagem
  const sync = useSync()

  const [dark, setDark] = useState(false)
  const [screen, setScreen] = useState<Screen>('busca')
  const [operador, setOperador] = useState('')
  const [pwaStatus, setPwaStatus] = useState('Rodando no navegador')

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [modal, setModal] = useState<Modal>(null)
  const [selId, setSelId] = useState<number | null>(null)
  const [alvoRefazerId, setAlvoRefazerId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [toast, setToastState] = useState<{ msg: string; tipo: ToastTipo } | null>(null)

  useEffect(() => {
    getSetting('operador').then(v => v && setOperador(v))
    getSetting('dark').then(v => v === '1' && setDark(true))
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
    if (standalone) setPwaStatus('Instalado como aplicativo')
  }, [])

  const showToast = useCallback((msg: string, tipo: ToastTipo = 'ok') => {
    setToastState({ msg, tipo })
    setTimeout(() => setToastState(null), 3000)
  }, [])

  async function toggleDark() {
    const next = !dark
    setDark(next)
    await setSetting('dark', next ? '1' : '0')
  }

  async function handleOperadorChange(v: string) {
    setOperador(v)
    await setSetting('operador', v)
  }

  function navigate(s: Screen, filtroPatch?: Partial<Filtros>) {
    setScreen(s)
    setModal(null)
    if (filtroPatch) setFiltros(f => ({ ...f, ...filtroPatch }))
  }

  function abrirFicha(id: number) {
    setSelId(id)
    setModal('ficha')
  }
  function fecharFicha() {
    setModal(null)
    setSelId(null)
  }

  const sel = athletes.find(a => a.id === selId) || null
  const alvoRefazer = athletes.find(a => a.id === alvoRefazerId) || null

  async function handleConfirmar() {
    if (!sel?.id) return
    const nome = sel.nome, num = sel.numero_inscricao, cat = sel.categoria || ''
    const record = await confirmar(sel.id, operador)
    setModal(null); setSelId(null)
    setFeedback({
      tipo: 'ok', titulo: 'Atleta confirmado', nome,
      detalhe: `#${num} · ${cat}`,
      assinatura: `Registrado por ${record.operador} às ${new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    })
  }

  async function handleInvalidar() {
    if (!sel?.id) return
    const nome = sel.nome, num = sel.numero_inscricao, cat = sel.categoria || ''
    const record = await invalidar(sel.id, operador)
    setModal(null); setSelId(null)
    setFeedback({
      tipo: 'erro', titulo: 'Atleta desclassificado', nome,
      detalhe: `#${num} · ${cat}`,
      assinatura: `Registrado por ${record.operador} às ${new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    })
  }

  function abrirRefazerDeFicha() {
    setAlvoRefazerId(selId)
    setModal('refazer')
  }
  function abrirRefazerDireto(athlete: Athlete) {
    if (!athlete.id) return
    setAlvoRefazerId(athlete.id)
    setSelId(null)
    setModal('refazer')
  }
  function cancelarRefazer() {
    setModal(selId != null ? 'ficha' : null)
    setAlvoRefazerId(null)
  }
  async function confirmarRefazer() {
    if (!alvoRefazerId) return
    const nome = alvoRefazer?.nome || ''
    await refazer(alvoRefazerId, operador)
    setModal(null); setAlvoRefazerId(null); setSelId(null)
    showToast(`Registro de ${nome} apagado — voltou para pendente.`, 'neutro')
  }

  async function confirmarZerar() {
    await zerarTudo(operador)
    setModal(null)
    showToast('Checagens zeradas.', 'erro')
  }

  const checados = stats.checados
  const ativos = filtros.categoria !== 'Todas' || filtros.sexo !== 'Todos' || filtros.uf !== 'Todas' || filtros.equipe !== 'Todas'
  const resultadosFiltrados = athletes.filter(a => {
    if (filtros.categoria !== 'Todas' && a.categoria !== filtros.categoria) return false
    if (filtros.sexo !== 'Todos' && a.sexo !== filtros.sexo) return false
    if (filtros.uf !== 'Todas' && a.uf !== filtros.uf) return false
    if (filtros.equipe !== 'Todas' && a.equipe !== filtros.equipe) return false
    return true
  }).length

  const titles: Record<Screen, { titulo: string; sub: string }> = {
    painel: { titulo: 'Painel', sub: 'Acompanhamento em tempo real' },
    busca: { titulo: 'Atletas', sub: `${stats.total} na base · ${stats.pendentes} pendentes` },
    historico: { titulo: 'Histórico', sub: 'Registros de checagem' },
    relatorios: { titulo: 'Relatórios', sub: 'Excel ou PDF' },
    config: { titulo: 'Configurações', sub: 'Coordenação, app e backup' },
  }
  const { titulo, sub } = titles[screen]

  const initials = operador.trim()
    ? operador.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'OP'

  return (
    <div className={(dark ? 'dark ' : '') + 'flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)] min-[900px]:flex-row min-[900px]:gap-4 min-[900px]:p-4'}>

      {/* ── RAIL (desktop) ── */}
      <aside
        className="sticky top-4 hidden h-[calc(100vh-2rem)] w-56 flex-none flex-col rounded-2xl border p-4 min-[900px]:flex"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="mb-3 flex items-center gap-2.5 border-b pb-3.5" style={{ borderColor: 'var(--line2)' }}>
          <img src="/icon-192.png" width={32} height={32} alt="" className="flex-none rounded-lg" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>TEPEQUÉM UP</span>
            <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Checagem 2026</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          {NAV.map(n => (
            <button
              key={n.k}
              onClick={() => navigate(n.k)}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px]"
              style={screen === n.k
                ? { background: 'var(--accent)', color: 'var(--onAccent)', fontWeight: 500 }
                : { color: 'var(--ink2)', fontWeight: 400 }}
            >
              <Icon name={n.icon} size={18} className="flex-none" />
              <span className="flex-1">{n.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2.5 border-t pt-3.5" style={{ borderColor: 'var(--line2)' }}>
          <div className="flex flex-col gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Progresso</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{stats.pct}%</span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full" style={{ background: 'var(--row)' }}>
              <div className="h-full rounded-full transition-[width_.4s_ease]" style={{ background: 'var(--accent)', width: `${stats.pct}%` }} />
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>{checados} de {stats.total} atletas</span>
          </div>
          <div className="flex items-center gap-2.5 px-0.5 py-1">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--onAccent)' }}>
              {initials}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-xs font-medium" style={{ color: 'var(--ink)' }}>{operador || 'Operador'}</span>
              <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>Coordenação</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── COLUNA PRINCIPAL ── */}
      <div className="flex flex-1 min-w-0 flex-col min-[900px]:gap-3.5">

        {/* Header */}
        <div
          className="sticky top-0 z-10 flex flex-col gap-2.5 border-b px-3.5 pb-2.5 pt-[calc(10px+env(safe-area-inset-top))] min-[900px]:static min-[900px]:border-0 min-[900px]:px-0 min-[900px]:pb-0 min-[900px]:pt-0"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <img src="/icon-192.png" width={30} height={30} alt="" className="flex-none rounded-lg min-[900px]:hidden" />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[17px] font-semibold min-[900px]:text-[19px]" style={{ color: 'var(--ink)' }}>{titulo}</span>
                <span className="truncate text-[11.5px]" style={{ color: 'var(--ink3)' }}>{sub}</span>
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <div className="hidden h-[38px] items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3 text-xs min-[900px]:flex" style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink2)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
                Banco conectado
              </div>
              <button
                onClick={toggleDark}
                className="flex h-[38px] items-center gap-2 rounded-[10px] border px-2.5 text-xs"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink2)' }}
              >
                <span className="hidden min-[900px]:inline">{dark ? 'Escuro' : 'Claro'}</span>
                <span className="flex h-[19px] w-[34px] flex-none rounded-full p-0.5 transition-colors" style={{ background: dark ? 'var(--accent)' : '#b9c2d0' }}>
                  <span className="h-[15px] w-[15px] rounded-full bg-white transition-transform" style={{ transform: dark ? 'translateX(15px)' : 'translateX(0)' }} />
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2.5 min-[900px]:hidden">
            <div className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--row)' }}>
              <div className="h-full rounded-full transition-[width_.4s_ease]" style={{ background: 'var(--accent)', width: `${stats.pct}%` }} />
            </div>
            <span className="flex-none text-[11px] font-medium" style={{ color: 'var(--ink2)' }}>{checados}/{stats.total} · {stats.pct}%</span>
          </div>
        </div>

        <InstallBanner />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 p-3 px-3.5 pb-[calc(84px+env(safe-area-inset-bottom))] min-[900px]:p-0" key={screen}>
          {screen === 'painel' && (
            <PainelPage stats={stats} athletes={athletes} onNavigate={navigate} sync={sync} />
          )}
          {screen === 'busca' && (
            <BuscaPage
              athletes={athletes}
              filtros={filtros}
              onFiltrosChange={setFiltros}
              categorias={categorias}
              onAbrirFiltros={() => setModal('filtros')}
              filtrosAtivos={ativos}
              onSelect={abrirFicha}
            />
          )}
          {screen === 'historico' && (
            <HistoricoPage athletes={athletes} onRefazer={abrirRefazerDireto} />
          )}
          {screen === 'relatorios' && <RelatoriosPage stats={stats} athletes={athletes} sync={sync} />}
          {screen === 'config' && (
            <ConfigPage
              operador={operador}
              onOperadorChange={handleOperadorChange}
              pwaStatus={pwaStatus}
              total={stats.total}
              checados={checados}
              onAbrirZerar={() => setModal('zerar')}
              sync={sync}
            />
          )}
        </div>

        {/* Tabbar (mobile) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] min-[900px]:hidden"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          {NAV.map(n => (
            <button
              key={n.k}
              onClick={() => navigate(n.k)}
              className="flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[10px]"
              style={screen === n.k ? { color: 'var(--accent)', background: 'var(--accentSoft)' } : { color: 'var(--ink3)' }}
            >
              <Icon name={n.icon} size={21} />
              <span className="text-[10.5px] font-medium tracking-wide">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── MODAIS ── */}
      {modal === 'filtros' && (
        <FiltrosSheet
          filtros={filtros}
          onChange={setFiltros}
          categorias={categorias}
          ufs={ufs}
          equipes={equipes}
          resultados={resultadosFiltrados}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'ficha' && sel && (
        <FichaSheet
          athlete={sel}
          onClose={fecharFicha}
          onConfirmar={handleConfirmar}
          onInvalidar={handleInvalidar}
          onAbrirRefazer={abrirRefazerDeFicha}
        />
      )}
      {modal === 'refazer' && alvoRefazer && (
        <RefazerDialog athlete={alvoRefazer} onCancel={cancelarRefazer} onConfirm={confirmarRefazer} />
      )}
      {modal === 'zerar' && (
        <ZerarDialog checados={checados} total={stats.total} onCancel={() => setModal(null)} onConfirm={confirmarZerar} />
      )}

      {feedback && <FeedbackOverlay data={feedback} onClose={() => setFeedback(null)} />}
      {toast && <Toast mensagem={toast.msg} tipo={toast.tipo} />}
    </div>
  )
}
