import { useEffect, useState } from 'react'
import { getDeviceLabel, setDeviceLabel } from '../db/database'
import type { useSync } from '../hooks/useSync'
import { AdminResetDialog } from '../components/AdminResetDialog'

interface ConfigPageProps {
  operador: string
  onOperadorChange: (v: string) => void
  pwaStatus: string
  total: number
  checados: number
  onAbrirZerar: () => void
  onZerarNuvemSucesso: () => void
  sync: ReturnType<typeof useSync>
}

export function ConfigPage({ operador, onOperadorChange, pwaStatus, total, checados, onAbrirZerar, onZerarNuvemSucesso, sync }: ConfigPageProps) {
  const [aparelhoLabel, setMesaLabel] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [showAdminReset, setShowAdminReset] = useState(false)

  useEffect(() => { getDeviceLabel().then(setMesaLabel) }, [])

  async function handleAparelhoLabelChange(v: string) {
    setMesaLabel(v)
    await setDeviceLabel(v)
  }

  const initials = operador.trim()
    ? operador.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'OP'

  return (
    <div className="flex max-w-[720px] flex-col gap-3">

      {/* Coordenação */}
      <div className="flex flex-col gap-3 rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--onAccent)' }}>
            {initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <input
              value={operador}
              onChange={e => onOperadorChange(e.target.value)}
              placeholder="Nome do coordenador / fiscal"
              className="h-9 w-full rounded-lg border px-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
            />
            <span className="text-xs" style={{ color: 'var(--ink3)' }}>Nome anexado a cada checagem</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 border-t pt-3" style={{ borderColor: 'var(--line2)' }}>
          <span className="text-[11px] font-medium" style={{ color: 'var(--ink3)' }}>Nome deste aparelho</span>
          <input
            value={aparelhoLabel}
            onChange={e => handleAparelhoLabelChange(e.target.value)}
            placeholder="Ex: Aparelho 1, Celular da coordenação..."
            className="h-9 w-full rounded-lg border px-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
          />
          <span className="text-xs" style={{ color: 'var(--ink3)' }}>Ajuda a identificar de onde veio cada checagem na listagem principal</span>
        </div>
      </div>

      {/* Aplicativo */}
      <div className="flex flex-col gap-2.5 rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Aplicativo</span>
        <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ok)' }} />{pwaStatus}
        </div>
        <span className="text-xs leading-relaxed" style={{ color: 'var(--ink3)' }}>
          Instale pelo menu do navegador ("Adicionar à tela de início") para usar em tela cheia, sem barra de endereço e com os dados disponíveis mesmo sem sinal.
        </span>
        <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ok)' }} />{total} atletas na base · {checados} checados
        </div>
      </div>

      {/* Sincronização entre aparelhos (só aparece quando o Supabase está configurado) */}
      {sync.isSupabaseConfigured && (
        <div className="flex flex-col gap-2.5 rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Sincronização entre aparelhos</span>
          <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--ink2)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sync.connected ? 'var(--ok)' : 'var(--ink3)' }} />
            {sync.connected ? 'Conectado — enviando checagens automaticamente' : 'Sem conexão no momento — checagens ficam guardadas e enviam sozinhas quando pegar sinal'}
          </div>
          <span className="text-xs" style={{ color: 'var(--ink3)' }}>
            {sync.pendingCount > 0 ? `${sync.pendingCount} checagem(ns) aguardando envio` : 'Tudo enviado'}
          </span>
          <button
            onClick={async () => {
              setSyncMsg('')
              const r = await sync.syncNow()
              if (r.ok) setSyncMsg(r.sent > 0 ? `${r.sent} checagem(ns) lançada(s) com sucesso.` : 'Tudo já estava enviado.')
              else setSyncMsg('Erro: não foi possível lançar agora — verifique a conexão e se a tabela foi criada no Supabase.')
            }}
            disabled={sync.syncing}
            className="h-[46px] rounded-[11px] text-[13.5px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {sync.syncing ? 'Lançando...' : 'Lançar para o servidor'}
          </button>
          {syncMsg && (
            <span className="text-xs" style={{ color: syncMsg.startsWith('Erro') ? 'var(--bad)' : 'var(--ok)' }}>{syncMsg}</span>
          )}
        </div>
      )}

      {/* Zona de risco */}
      <div className="flex flex-col gap-2.5 rounded-xl border p-4" style={{ background: 'var(--panel)', borderColor: 'var(--badLine)' }}>
        <span className="text-[13.5px] font-semibold" style={{ color: 'var(--badInk)' }}>Zona de risco</span>
        <span className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
          Devolve todos os atletas para "pendente", descartando as checagens registradas. Para desfazer um caso específico, use o Histórico.
        </span>
        <button
          onClick={onAbrirZerar}
          className="h-[46px] rounded-[11px] border text-[13.5px] font-medium"
          style={{ borderColor: 'var(--badLine)', background: 'var(--panel)', color: 'var(--bad)' }}
        >
          Zerar todas as checagens
        </button>
        {sync.isSupabaseConfigured && (
          <>
            <div className="border-t pt-2.5" style={{ borderColor: 'var(--badLine)' }}>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
                Apaga o histórico combinado de todos os aparelhos na nuvem — use só pra reiniciar testes, nunca depois que a prova começar.
              </span>
            </div>
            <button
              onClick={() => setShowAdminReset(true)}
              className="h-[46px] rounded-[11px] text-[13.5px] font-medium text-white"
              style={{ background: 'var(--bad)' }}
            >
              Zerar tudo — nuvem inteira
            </button>
          </>
        )}
      </div>

      {showAdminReset && (
        <AdminResetDialog
          onCancel={() => setShowAdminReset(false)}
          onSuccess={() => { setShowAdminReset(false); onZerarNuvemSucesso() }}
        />
      )}
    </div>
  )
}
