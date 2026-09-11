import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  onClose: () => void
  children: ReactNode
  zIndex?: number
}

/** Small centered dialog (same on mobile and desktop) — used for Refazer/Zerar. */
export function ConfirmDialog({ onClose, children, zIndex = 45 }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4.5 animate-[fade_.16s_ease]"
      style={{ background: 'var(--scrim)', zIndex }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="flex w-full max-w-[440px] flex-col gap-3.5 rounded-2xl p-4.5 animate-[riseIn_.2s_cubic-bezier(.2,.8,.3,1)]"
        style={{ background: 'var(--panel)', boxShadow: 'var(--shadow)' }}
      >
        {children}
      </div>
    </div>
  )
}
