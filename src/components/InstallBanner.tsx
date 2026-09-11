import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const DISMISS_KEY = 'install_banner_dismissed'

export function InstallBanner() {
  const { installed, isIos, canPrompt, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  if (installed || dismissed || !(canPrompt || isIos)) return null

  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignora se bloqueado */ }
    setDismissed(true)
  }

  return (
    <div
      className="mx-3.5 mt-2.5 flex items-center gap-3 rounded-xl border p-3 min-[900px]:mx-0"
      style={{ background: 'var(--accentSoft)', borderColor: 'var(--accentLine)' }}
    >
      <img src="/icon-192.png" width={36} height={36} alt="" className="flex-none rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Instale o app da Tepequém Up</p>
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink3)' }}>
          {canPrompt
            ? 'Acesso rápido e funciona offline durante o evento.'
            : 'Toque em Compartilhar e depois em "Adicionar à Tela de Início" para usar offline.'}
        </p>
      </div>
      {canPrompt && (
        <button
          onClick={promptInstall}
          className="h-9 flex-none rounded-lg px-3 text-[12.5px] font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Instalar
        </button>
      )}
      <button onClick={dismiss} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>
        ✕
      </button>
    </div>
  )
}
