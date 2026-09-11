import type { ReactNode } from 'react'

interface SheetProps {
  onClose: () => void
  children: ReactNode
  /** wider sheet, used for the athlete detail (ficha) */
  wide?: boolean
  zIndex?: number
}

/**
 * Bottom sheet on mobile (<900px), centered modal on desktop (>=900px).
 * Pure CSS breakpoint — no JS viewport tracking needed.
 */
export function Sheet({ onClose, children, wide, zIndex = 30 }: SheetProps) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center min-[900px]:items-center animate-[fade_.16s_ease]"
      style={{ background: 'var(--scrim)', zIndex }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={
          'flex w-full flex-col rounded-t-[18px] min-[900px]:rounded-2xl ' +
          'max-h-[88vh] min-[900px]:max-h-[86vh] max-w-full ' +
          'animate-[sheetUp_.24s_cubic-bezier(.2,.8,.3,1)] min-[900px]:animate-[riseIn_.2s_cubic-bezier(.2,.8,.3,1)] ' +
          (wide ? 'min-[900px]:w-[860px]' : 'min-[900px]:w-[640px]')
        }
        style={{ background: 'var(--panel)', boxShadow: 'var(--shadow)' }}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetFooter({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2.5 border-t px-4.5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-[900px]:pb-3"
      style={{ borderColor: 'var(--line2)' }}
    >
      {children}
    </div>
  )
}
