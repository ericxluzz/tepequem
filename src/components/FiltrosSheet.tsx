import { Sheet, SheetFooter } from './Sheet'
import { ORDENS, FILTROS_VAZIOS, type Filtros } from '../types/filtros'

interface FiltrosSheetProps {
  filtros: Filtros
  onChange: (f: Filtros) => void
  categorias: string[]
  ufs: string[]
  equipes: string[]
  resultados: number
  onClose: () => void
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11.5px] font-medium" style={{ color: 'var(--ink3)' }}>{label}</span>
      <div className="relative flex">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-[46px] w-full rounded-xl border pl-3.5 pr-9 text-sm outline-none"
          style={{ borderColor: 'var(--line)', background: 'var(--field)', color: 'var(--ink)' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span
          className="pointer-events-none absolute right-3.5 top-0 flex h-[46px] items-center text-[10px]"
          style={{ color: 'var(--ink3)' }}
        >▼</span>
      </div>
    </div>
  )
}

export function FiltrosSheet({ filtros, onChange, categorias, ufs, equipes, resultados, onClose }: FiltrosSheetProps) {
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between border-b px-4.5 py-3.5" style={{ borderColor: 'var(--line2)' }}>
        <span className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>Filtros</span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
          style={{ color: 'var(--ink3)' }}
        >✕</button>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3.5 overflow-auto p-4.5 min-[900px]:grid-cols-2">
        <SelectField label="Modalidade" value={filtros.categoria} options={['Todas', ...categorias]}
          onChange={v => onChange({ ...filtros, categoria: v })} />
        <SelectField label="Sexo" value={filtros.sexo} options={['Todos', 'Masculino', 'Feminino']}
          onChange={v => onChange({ ...filtros, sexo: v })} />
        <SelectField label="Equipe" value={filtros.equipe} options={['Todas', ...equipes]}
          onChange={v => onChange({ ...filtros, equipe: v })} />
        <SelectField label="UF" value={filtros.uf} options={['Todas', ...ufs]}
          onChange={v => onChange({ ...filtros, uf: v })} />
        <SelectField label="Ordenar por" value={filtros.ordem} options={[...ORDENS]}
          onChange={v => onChange({ ...filtros, ordem: v as Filtros['ordem'] })} />
      </div>
      <SheetFooter>
        <button
          onClick={() => onChange({ ...FILTROS_VAZIOS, query: filtros.query })}
          className="h-12 flex-1 rounded-xl border text-sm font-medium"
          style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--ink2)' }}
        >Limpar</button>
        <button
          onClick={onClose}
          className="h-12 flex-[1.4] rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--onAccent)' }}
        >Ver {resultados} atletas</button>
      </SheetFooter>
    </Sheet>
  )
}
