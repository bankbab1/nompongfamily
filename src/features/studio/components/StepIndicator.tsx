import { Check } from 'lucide-react'
import { useT, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import type { WizardStep } from '../model/draft'

/* Step 1 (request type) is retired: there is only one kind of request now. */
const STEPS: { n: WizardStep; key: MessageKey }[] = [
  { n: 2, key: 'wizard.step2' },
  { n: 3, key: 'wizard.step3' },
  { n: 4, key: 'wizard.step4' },
  { n: 5, key: 'wizard.step5' },
]

export function StepIndicator({ step, onStep }: { step: WizardStep; onStep(n: WizardStep): void; lockedChannel?: boolean }) {
  const t = useT()
  const current = STEPS.find((s) => s.n === step)!
  return (
    <nav aria-label="ขั้นตอน">
      {/* Mobile: compact text + bar */}
      <div className="sm:hidden">
        <p className="text-sm text-muted">
          ขั้นตอน {step - 1}/{STEPS.length} · <span className="font-medium text-ink">{t(current.key)}</span>
        </p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((s) => (
            <span key={s.n} className={cn('h-1.5 flex-1 rounded-full', s.n <= step ? 'bg-brown' : 'bg-line')} />
          ))}
        </div>
      </div>
      {/* sm+: clickable stepper */}
      <ol className="hidden items-center gap-1 sm:flex">
        {STEPS.map((s, i) => {
          const done = s.n < step
          const active = s.n === step
          const disabled = false
          return (
            <li key={s.n} className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onStep(s.n)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-left text-sm',
                  active ? 'font-semibold text-ink' : 'text-muted hover:bg-surface-muted',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    active ? 'border-brown bg-sunny text-brown' : done ? 'border-brown bg-brown text-cream' : 'border-line-strong',
                  )}
                  aria-hidden
                >
                  {done ? <Check size={14} strokeWidth={3} /> : s.n - 1}
                </span>
                <span className="truncate">{t(s.key)}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-0.5 min-w-3 flex-1 rounded bg-line" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
