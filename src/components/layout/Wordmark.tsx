import { Link } from 'react-router'
import { cn } from '@/lib/utils/cn'

/** Text wordmark in the brand's lowercase social styling (spec §5). Swap for the approved logo file. */
export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 rounded-xl py-1 text-ink', className)} aria-label="nompong family">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sunny font-display text-[13px] font-semibold text-[#26221f]" aria-hidden>
        np
      </span>
      {!compact && <span className="font-display text-[17px] leading-none font-semibold tracking-tight whitespace-nowrap">nompong family</span>}
    </Link>
  )
}
