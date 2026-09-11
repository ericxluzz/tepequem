export const ICON_PATHS = {
  painel: 'M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z',
  atletas: 'M12 4a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM4.5 20c0-3.2 3.4-5 7.5-5s7.5 1.8 7.5 5',
  historico: 'M12 7.5V12l3 1.8M3.5 12a8.5 8.5 0 108.5-8.5A8.4 8.4 0 005.6 6.4M3.5 3.5v3.4h3.4',
  relatorios: 'M14 3.5H7.5a2 2 0 00-2 2v13a2 2 0 002 2h9a2 2 0 002-2V8zM14 3.5V8h4.5M9 13h6M9 16.5h4',
  config: 'M4 7h9M17.5 7H20M4 17h2.5M11 17h9M15 4.2v5.6M8 14.2v5.6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-3.5-3.5',
  filter: 'M4 7h16M7 12h10M10 17h4',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z',
} as const

export type IconName = keyof typeof ICON_PATHS

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
