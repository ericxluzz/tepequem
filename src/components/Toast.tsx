export type ToastTipo = 'ok' | 'erro' | 'neutro'

export function Toast({ mensagem, tipo }: { mensagem: string; tipo: ToastTipo }) {
  const dot = tipo === 'erro' ? '#f87171' : tipo === 'neutro' ? '#93a3b8' : '#4ade80'
  return (
    <div
      className={
        'fixed left-1/2 z-[55] flex max-w-[90vw] -translate-x-1/2 items-center gap-2.5 rounded-xl px-4 py-3 ' +
        'bottom-[calc(92px+env(safe-area-inset-bottom))] min-[900px]:bottom-6 ' +
        'text-[12.5px] font-medium leading-tight text-white animate-[toastIn_.2s_cubic-bezier(.2,.8,.3,1)]'
      }
      style={{ background: '#0f172a', boxShadow: '0 12px 30px rgba(15,23,42,0.32)' }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: dot }} />
      {mensagem}
    </div>
  )
}
