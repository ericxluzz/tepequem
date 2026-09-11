import { useEffect } from 'react'

export interface FeedbackData {
  tipo: 'ok' | 'erro'
  titulo: string
  nome: string
  detalhe: string
  assinatura: string
}

const CHECK = 'M22 34.5l8.5 8.5L47 26'
const CROSS = 'M25 25l18 18M43 25L25 43'

export function FeedbackOverlay({ data, onClose }: { data: FeedbackData; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200)
    return () => clearTimeout(t)
  }, [onClose])

  const ok = data.tipo === 'ok'
  const color = ok ? 'var(--ok)' : 'var(--bad)'
  const track = ok ? 'var(--okBg)' : 'var(--badBg)'
  const path = ok ? CHECK : CROSS

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5.5 p-7 text-center animate-[fade_.18s_ease]"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
    >
      <div className="flex h-[116px] w-[116px] items-center justify-center animate-[pop_.5s_cubic-bezier(.2,.9,.3,1.2)]">
        <svg width={116} height={116} viewBox="0 0 68 68" fill="none">
          <circle cx={34} cy={34} r={30} stroke={track} strokeWidth={4} />
          <circle
            cx={34} cy={34} r={30} stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={189} strokeDashoffset={189} transform="rotate(-90 34 34)"
            style={{ animation: 'ring .9s cubic-bezier(.4,0,.2,1) forwards' }}
          />
          <path
            d={path} stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={48} strokeDashoffset={48}
            style={{ animation: 'draw .55s cubic-bezier(.4,0,.2,1) .5s forwards' }}
          />
        </svg>
      </div>
      <div className="flex max-w-[520px] flex-col items-center gap-2 animate-[riseIn_.45s_ease_.3s_both]">
        <span className="text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color }}>{data.titulo}</span>
        <span className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>{data.nome}</span>
        <span className="text-sm leading-relaxed" style={{ color: 'var(--ink2)' }}>{data.detalhe}</span>
        <span className="text-[12.5px]" style={{ color: 'var(--ink3)' }}>{data.assinatura}</span>
      </div>
      <div className="flex flex-col items-center gap-3 animate-[fade_.3s_ease_.6s_both]">
        <button
          onClick={onClose}
          className="h-[46px] rounded-xl border px-6.5 text-sm font-medium"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink2)' }}
        >
          Continuar checagem
        </button>
        <span className="h-[3px] w-[168px] overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
          <span
            className="block h-full w-full origin-left"
            style={{ background: color, animation: 'countdown 4.2s linear forwards' }}
          />
        </span>
      </div>
    </div>
  )
}
