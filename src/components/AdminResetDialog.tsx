import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

interface AdminResetDialogProps {
  onCancel: () => void
  onSuccess: () => void
}

export function AdminResetDialog({ onCancel, onSuccess }: AdminResetDialogProps) {
  const [texto, setTexto] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const ok = texto.trim().toUpperCase() === 'CONFIRMAR' && senha.trim().length > 0

  async function confirmar() {
    setEnviando(true)
    setErro('')
    try {
      const res = await fetch('/api/admin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senha }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(res.status === 401 ? 'Senha incorreta.' : (data.error || 'Falha ao apagar na nuvem.'))
        return
      }
      onSuccess()
    } catch {
      setErro('Não foi possível conectar ao servidor — verifique a internet.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ConfirmDialog onClose={onCancel} zIndex={50}>
      <span className="text-base font-semibold" style={{ color: 'var(--badInk)' }}>Zerar tudo — nuvem inteira</span>
      <span className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
        Apaga <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>todo o histórico de checagens de todos os aparelhos</strong> na nuvem, pra sempre. Este aparelho também será zerado. Os outros 3 aparelhos vão continuar mostrando a contagem antiga localmente até que alguém abra o app neles (aí serão avisados e poderão zerar também).
      </span>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>Senha de administrador</span>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          className="h-12 rounded-xl border px-3.5 text-sm outline-none"
          style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>Digite CONFIRMAR para continuar</span>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          className="h-12 rounded-xl border px-3.5 text-sm outline-none"
          style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
        />
      </div>
      {erro && <span className="text-xs" style={{ color: 'var(--bad)' }}>{erro}</span>}
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="h-12 flex-1 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}>
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={!ok || enviando}
          className="h-12 flex-[1.3] rounded-xl text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--bad)' }}
        >
          {enviando ? 'Apagando...' : 'Zerar tudo'}
        </button>
      </div>
    </ConfirmDialog>
  )
}
