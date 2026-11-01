import { Link } from 'react-router'
import { cn } from '@/lib/utils/cn'
// Nav-size copy (192px) of the master logo at src/assets/brand/nompong-family.png (704px).
import logo from '@/assets/brand/nompong-family-192.png'

/** Brand badge + lowercase wordmark (spec §5). `compact` shows the badge only. */
export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 rounded-xl py-1 text-ink', className)} aria-label="nompong family">
      <img src={logo} alt="" width={40} height={40} decoding="async" className="h-10 w-10 shrink-0 object-contain" aria-hidden />
      {!compact && <span className="font-display text-[17px] leading-none font-semibold tracking-tight whitespace-nowrap">nompong family</span>}
    </Link>
  )
}
