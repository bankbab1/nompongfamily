import { LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

export type ViewMode = 'grid' | 'list'

/** Grid or list, remembered on this device under `storageKey` (grid by default). */
export function useViewMode(storageKey: string) {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(storageKey) === 'list' ? 'list' : 'grid'
    } catch {
      return 'grid'
    }
  })
  const change = (v: ViewMode) => {
    setView(v)
    try {
      localStorage.setItem(storageKey, v)
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }
  return [view, change] as const
}

/** Phones only: see a collection as a grid of covers or as a list of rows. */
export function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const tx = useTx()
  const options: { id: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
    { id: 'grid', label: tx('แสดงแบบตาราง', 'Grid view'), Icon: LayoutGrid },
    { id: 'list', label: tx('แสดงแบบรายการ', 'List view'), Icon: List },
  ]
  return (
    <div role="group" aria-label={tx('มุมมอง', 'View')} className="flex shrink-0 rounded-full bg-surface-muted p-1 sm:hidden">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={cn('flex h-9 w-9 items-center justify-center rounded-full transition-colors', view === id ? 'selected-chip text-ink' : 'text-muted')}
        >
          <Icon size={17} aria-hidden />
        </button>
      ))}
    </div>
  )
}
