import { useEffect, useRef } from 'react'

export interface FeedbackData {
  tipo: 'ok' | 'erro'
  titulo: string
  nome: string
  detalhe: string
  assinatura: string
}

const CHECK = 'M22 34.5l8.5 8.5L47 26'
const CROSS = 'M25 25l18 18M43 25L25 43'
const DURACAO_MS = 1000

/**
 * Aviso rápido de confirmado/desclassificado. Não captura toques
 * (pointer-events-none): dá pra já tocar no próximo atleta enquanto ele
 * ainda está na tela. Um aviso novo substitui o anterior e reinicia o tempo.
 */
export function FeedbackOverlay({ data, onClose }: { data: FeedbackData; onClose: () => void }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), DURACAO_MS)
    return () => clearTimeout(t)
  }, [data])

  const ok = data.tipo === 'ok'
  const color = ok ? 'var(--ok)' : 'var(--bad)'
  const track = ok ? 'var(--okBg)' : 'var(--badBg)'
  const path = ok ? CHECK : CROSS

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[12%] z-[60] flex justify-center px-5">
      <div
        className="flex w-full max-w-[420px] items-center gap-3.5 rounded-2xl border-2 p-3.5 animate-[pop_.16s_ease-out]"
        style={{ background: 'var(--panel)', borderColor: color, boxShadow: 'var(--shadow)' }}
      >
        <svg width={56} height={56} viewBox="0 0 68 68" fill="none" className="flex-none">
          <circle cx={34} cy={34} r={30} stroke={track} strokeWidth={4} />
          <circle
            cx={34} cy={34} r={30} stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={189} strokeDashoffset={189} transform="rotate(-90 34 34)"
            style={{ animation: 'ring .22s ease-out forwards' }}
          />
          <path
            d={path} stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={48} strokeDashoffset={48}
            style={{ animation: 'draw .16s ease-out .1s forwards' }}
          />
        </svg>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color }}>{data.titulo}</span>
          <span className="truncate text-[17px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{data.nome}</span>
          <span className="truncate text-[12.5px]" style={{ color: 'var(--ink3)' }}>{data.detalhe}</span>
        </div>
      </div>
    </div>
  )
}
