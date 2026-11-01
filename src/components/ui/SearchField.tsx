import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { pick } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { inputClass } from './Field'

/**
 * A rounded search box with a magnifier and our own clear (✕) button. The browser's built-in clear
 * button is hidden in globals.css so it looks the same everywhere.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className,
  inputClassName,
  lang,
}: {
  value: string
  onChange: (value: string) => void
  /** Read by screen readers. */
  label: string
  placeholder?: string
  className?: string
  inputClassName?: string
  lang?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && value && (e.preventDefault(), onChange(''))}
        placeholder={placeholder}
        aria-label={label}
        className={cn(inputClass, 'h-11 rounded-full pr-11 pl-11', inputClassName)}
        lang={lang}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
          aria-label={pick({ th: 'ล้างคำค้น', en: 'Clear search' })}
          className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  )
}
