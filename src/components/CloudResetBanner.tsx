interface CloudResetBannerProps {
  onZerarLocal: () => void
  onIgnorar: () => void
}

export function CloudResetBanner({ onZerarLocal, onIgnorar }: CloudResetBannerProps) {
  return (
    <div
      className="mx-3.5 mt-2.5 flex items-center gap-3 rounded-xl border p-3 min-[900px]:mx-0"
      style={{ background: 'var(--badBg)', borderColor: 'var(--badLine)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--badInk)' }}>A nuvem foi zerada</p>
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink2)' }}>
          Outro aparelho (ou o painel do Supabase) apagou o histórico combinado. Zerar este aparelho também pra ficar tudo igual de novo?
        </p>
      </div>
      <button
        onClick={onZerarLocal}
        className="h-9 flex-none rounded-lg px-3 text-[12.5px] font-medium text-white"
        style={{ background: 'var(--bad)' }}
      >
        Zerar aqui também
      </button>
      <button onClick={onIgnorar} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-base" style={{ color: 'var(--ink3)' }}>
        ✕
      </button>
    </div>
  )
}
