import { Link } from 'react-router'
import { NompongLogo } from '@/features/nompong/art'
import { cn } from '@/lib/utils/cn'

/** Text wordmark in the brand's lowercase social styling (spec §5). Swap for the approved logo file. */
export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 rounded-xl py-1 text-ink', className)} aria-label="nompong family หน้าแรก">
      <NompongLogo className="h-10 w-10 shrink-0" decorative />
      {!compact && <span className="font-display text-lg leading-none font-medium tracking-tight">nompong family</span>}
    </Link>
  )
}
