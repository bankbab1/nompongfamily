import { Check, ChevronLeft, ChevronRight, ListPlus, Pencil, RotateCcw, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { confirm } from '@/components/ui/ConfirmDialog'
import { TextArea, TextField } from '@/components/ui/Field'
import { fill, useCopy } from '@/lib/copy'
import { cn } from '@/lib/utils/cn'
import {
  emptySticker,
  ERROR_LIMIT,
  hasErrors,
  isFilled,
  LIMITS,
  MAX_STICKERS,
  MOODS,
  STICKER_COUNTS,
  validateSuggestion,
  type MoodId,
  type StickerCount,
  type StickerIdea,
  type SuggestionErrorCode,
  type SuggestionErrors,
  type SuggestionInput,
} from './model'
import { MoodIcon } from './MoodIcon'
import { StickerCarousel, StickerPager, StickerStrip } from './stickerCards'

/* ---------- Draft kept on this device so a refresh never loses 40 stickers of work ---------- */

interface Draft {
  stickerCount: StickerCount
  mood: MoodId
  nameTh: string
  nameEn: string
  descTh: string
  descEn: string
  /** Always MAX_STICKERS long; slots beyond the count stay hidden, not deleted. */
  stickers: StickerIdea[]
  nickname: string
}

const DRAFT_KEY = 'nompong.builder.draft.v1'

const freshDraft = (): Draft => ({
  // 32 is the most common LINE set size, so a new design starts there.
  stickerCount: 32,
  mood: 'cute',
  nameTh: '',
  nameEn: '',
  descTh: '',
  descEn: '',
  stickers: Array.from({ length: MAX_STICKERS }, emptySticker),
  nickname: '',
})

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return freshDraft()
    const d = { ...freshDraft(), ...(JSON.parse(raw) as Partial<Draft>) }
    const stickers = Array.from({ length: MAX_STICKERS }, (_, i) => ({ ...emptySticker(), ...d.stickers?.[i] }))
    return { ...d, stickers, stickerCount: STICKER_COUNTS.includes(d.stickerCount) ? d.stickerCount : 32 }
  } catch {
    return freshDraft()
  }
}

function saveDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* storage blocked: the draft lives for this visit only */
  }
}

const EMPTY_ERRORS: SuggestionErrors = { fields: {}, stickers: {} }

function useErrorText() {
  const c = useCopy()
  return (code?: SuggestionErrorCode) => (code ? fill(c.errors[code], { max: ERROR_LIMIT[code] }) : undefined)
}

/* ---------- Builder ---------- */

export function StickerSetBuilder({ onSubmit, submitting }: { onSubmit: (input: SuggestionInput) => Promise<unknown>; submitting: boolean }) {
  const c = useCopy()
  const b = c.builder
  const errText = useErrorText()
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [active, setActive] = useState(0)
  const [errors, setErrors] = useState<SuggestionErrors>(EMPTY_ERRORS)
  const nameRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>(1)
  const countTrack = useRef<HTMLDivElement>(null)
  const countPill = useSlidingPill(countTrack, '[aria-checked="true"]', [draft.stickerCount, step])

  useEffect(() => saveDraft(draft), [draft])

  const count = draft.stickerCount
  const visible = draft.stickers.slice(0, count)
  // What gets checked and sent: a sticker left to the creator drops any half-typed word or pose.
  const outgoing = visible.map((s) => (s.creatorPicks ? { word: '', style: '', creatorPicks: true } : { word: s.word, style: s.style }))
  const filled = visible.filter(isFilled).length
  const byCreator = visible.filter((s) => s.creatorPicks).length
  const hiddenFilled = draft.stickers.slice(count).some(isFilled)

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setErrors((e) => ({ ...e, fields: { ...e.fields, [k]: undefined, ...(k === 'nameTh' || k === 'nameEn' ? { nameTh: undefined, nameEn: undefined } : {}) } }))
  }

  const setSticker = (i: number, patch: Partial<StickerIdea>) => {
    setDraft((d) => ({ ...d, stickers: d.stickers.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))
    setErrors((e) => {
      const stickers = { ...e.stickers }
      delete stickers[i]
      return { fields: { ...e.fields, stickers: undefined }, stickers }
    })
  }

  const changeCount = (n: StickerCount) => {
    set('stickerCount', n)
    if (active >= n) setActive(n - 1)
  }

  /** Puts one word per line into the empty stickers, in order. Returns how many were filled. */
  const bulkFill = (text: string) => {
    const words = text
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter(Boolean)
    const stickers = [...draft.stickers]
    let used = 0
    for (let i = 0; i < draft.stickerCount && used < words.length; i++) {
      if (!stickers[i].word.trim() && !stickers[i].creatorPicks) stickers[i] = { ...stickers[i], word: words[used++] }
    }
    if (used) setDraft({ ...draft, stickers })
    return used
  }

  /** Hands every still-empty sticker to the creator. Returns how many changed. */
  const creatorForRest = () => {
    let n = 0
    const stickers = draft.stickers.map((s, i) => {
      if (i >= count || isFilled(s)) return s
      n++
      return { ...s, creatorPicks: true }
    })
    if (n) {
      setDraft({ ...draft, stickers })
      setErrors((e) => ({ ...e, fields: { ...e.fields, stickers: undefined } }))
      toast.success(fill(b.creatorRestDone, { n }))
    } else toast.info(b.creatorRestNone)
  }

  const reset = async () => {
    const ok = await confirm({ title: b.resetConfirm, confirmLabel: b.reset, cancelLabel: b.cancel, tone: 'danger' })
    if (!ok) return
    setDraft(freshDraft())
    setErrors(EMPTY_ERRORS)
    setActive(0)
  }

  /** Errors that belong to one step: 1 = set details, 2 = stickers, 3 = your name. */
  const errorsFor = (s: Step, errs: SuggestionErrors): SuggestionErrors => {
    const keep = STEP_FIELDS[s]
    const fields = Object.fromEntries(Object.entries(errs.fields).filter(([k, v]) => v && keep.includes(k as FieldKey)))
    return { fields, stickers: s === 2 ? errs.stickers : {} }
  }

  const goTo = (s: Step) => {
    setStep(s)
    requestAnimationFrame(() => {
      const top = topRef.current
      if (!top) return
      if (top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' })
      top.focus({ preventScroll: true })
    })
  }

  /** Checks every step before `target`; stops on the first one with a problem. */
  const advanceTo = (target: Step) => {
    const all = validateSuggestion({ ...draft, stickers: outgoing })
    for (let s = 1 as Step; s < target; s = (s + 1) as Step) {
      const errs = errorsFor(s, all)
      if (hasErrors(errs)) {
        setErrors(errs)
        goTo(s)
        // Focus the first field with a problem (the Thai name is optional now, so not always the first box).
        if (s === 1)
          requestAnimationFrame(() => {
            const bad = topRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ;(bad ?? nameRef.current)?.focus()
          })
        if (s === 2) {
          const firstBad = Object.keys(errs.stickers)
            .map(Number)
            .sort((x, y) => x - y)[0]
          if (firstBad !== undefined) setActive(firstBad)
        }
        toast.error(c.suggest.fixErrors)
        return false
      }
    }
    setErrors(EMPTY_ERRORS)
    goTo(target)
    return true
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      advanceTo((step + 1) as Step)
      return
    }
    const input: SuggestionInput = { ...draft, stickers: outgoing }
    const errs = validateSuggestion(input)
    if (hasErrors(errs)) {
      if (hasErrors(errorsFor(3, errs)) && !hasErrors(errorsFor(1, errs)) && !hasErrors(errorsFor(2, errs))) {
        setErrors(errorsFor(3, errs))
        toast.error(c.suggest.fixErrors)
      } else advanceTo(3)
      return
    }
    try {
      await onSubmit(input)
    } catch {
      return // keep the draft; the page shows the error
    }
    setDraft(freshDraft())
    saveDraft(null)
    setActive(0)
    setStep(1)
  }

  const nameMain = draft.nameTh.trim() || draft.nameEn.trim()
  const milestones: Milestone[] = [
    { title: b.step1, detail: nameMain || fill(b.countUnit, { n: count }) },
    { title: b.step2, detail: fill(b.filled, { n: filled, total: count }) },
    { title: b.step3, detail: b.step3Detail },
  ]

  return (
    <form onSubmit={submit} noValidate>
      {/* Progress stays in view under the header while you work through a long step. */}
      <div className="sticky top-16 z-20 -mx-5 -mt-2 border-b border-line bg-surface/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85 sm:-mx-8 sm:px-8">
        <StepMilestones steps={milestones} current={step} onStep={(s) => (s < step ? goTo(s) : advanceTo(s))} />
      </div>

      <div ref={topRef} tabIndex={-1} className="scroll-mt-40 pt-8 focus:outline-none">
        {step === 1 && (
          <fieldset className="mx-auto max-w-2xl min-w-0 space-y-6">
            <legend className="t-section mb-6 font-display">{b.step1}</legend>

            <div>
              <p className="mb-2 text-sm font-medium" id="count-label">
                {b.count}
              </p>
              <div
                ref={countTrack}
                role="radiogroup"
                aria-labelledby="count-label"
                className="relative grid grid-cols-5 gap-1 rounded-2xl bg-surface-muted p-1"
              >
                <SlidingPill pill={countPill.pill} ready={countPill.ready} className="rounded-xl bg-surface shadow-sm" />
                {STICKER_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={count === n}
                    onClick={() => changeCount(n)}
                    className={cn(
                      'relative flex h-12 flex-col items-center justify-center rounded-xl text-base leading-none font-semibold tabular-nums transition-colors duration-300',
                      count === n ? 'text-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {n}
                    <span className={cn('mt-1 text-[10px] font-medium', count === n ? 'text-muted' : 'text-muted/70')}>
                      {fill(b.countUnit, { n: '' }).trim()}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">{b.countHint}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                ref={nameRef}
                lang="th"
                label={b.nameTh}
                optional
                placeholder={b.namePhTh}
                value={draft.nameTh}
                onChange={(e) => set('nameTh', e.target.value)}
                maxChars={LIMITS.name}
                error={errText(errors.fields.nameTh)}
                hint={b.thHint}
              />
              <TextField
                lang="en"
                label={b.nameEn}
                placeholder={b.namePhEn}
                value={draft.nameEn}
                onChange={(e) => set('nameEn', e.target.value)}
                maxChars={LIMITS.name}
                error={errText(errors.fields.nameEn)}
                hint={b.enHint}
              />
              <TextArea
                lang="th"
                label={b.descTh}
                optional
                hint={b.thHint}
                placeholder={b.descPhTh}
                value={draft.descTh}
                onChange={(e) => set('descTh', e.target.value)}
                maxChars={LIMITS.desc}
                error={errText(errors.fields.descTh)}
                rows={3}
              />
              <TextArea
                lang="en"
                label={b.descEn}
                hint={b.enHint}
                placeholder={b.descPhEn}
                value={draft.descEn}
                onChange={(e) => set('descEn', e.target.value)}
                maxChars={LIMITS.desc}
                error={errText(errors.fields.descEn)}
                rows={3}
              />
            </div>
            <p className="-mt-3 text-xs text-muted">{fill(b.lineHint, { name: LIMITS.name, desc: LIMITS.desc })}</p>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">{b.mood}</legend>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                      draft.mood === m.id ? 'border-brown bg-brown text-cream' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    <input type="radio" name="mood" value={m.id} checked={draft.mood === m.id} onChange={() => set('mood', m.id)} className="sr-only" />
                    <MoodIcon id={m.id} />
                    {c.moods[m.id]}
                  </label>
                ))}
              </div>
            </fieldset>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="min-w-0">
            <legend className="sr-only">{b.step2}</legend>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
              <div className="min-w-0 lg:order-2">
                <StickerPager active={active} total={count} onGo={setActive} />
                <StickerCarousel stickers={visible} active={active} onActive={setActive} errorsAt={errors.stickers} onChange={setSticker} />
              </div>
              <div className="min-w-0 lg:order-1">
                <h2 className="t-section font-display">{b.step2}</h2>
                <p className="mt-1 mb-4 text-sm text-muted">{b.stickersHint}</p>
                <StickerStrip stickers={visible} active={active} onSelect={setActive} errorAt={errors.stickers} />
                {errors.fields.stickers && <p className="mt-2 text-sm text-danger">{errText(errors.fields.stickers)}</p>}
                {hiddenFilled && <p className="mt-2 text-xs text-muted">{fill(b.hiddenNote, { from: count + 1, to: MAX_STICKERS })}</p>}
                <Button
                  variant="secondary"
                  block
                  className="mt-4 justify-start"
                  icon={<Sparkles size={17} />}
                  onClick={creatorForRest}
                  disabled={filled === count}
                >
                  {b.creatorRest}
                </Button>
                <BulkWords onApply={bulkFill} />
              </div>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="t-section font-display">{b.step3}</h2>

            <section className="rounded-2xl border border-line p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">
                    {fill(b.countUnit, { n: count })} · <MoodIcon id={draft.mood} size={13} className="inline -mt-0.5" /> {c.moods[draft.mood]}
                  </p>
                  <h3 className="mt-1 font-display text-lg leading-snug">{nameMain || b.reviewNoName}</h3>
                  {draft.nameTh.trim() && draft.nameEn.trim() && <p className="text-sm text-muted">{draft.nameEn}</p>}
                  {(draft.descTh.trim() || draft.descEn.trim()) && <p className="mt-2 text-sm text-muted">{draft.descTh.trim() || draft.descEn}</p>}
                </div>
                <Button size="sm" variant="ghost" icon={<Pencil size={15} />} onClick={() => goTo(1)}>
                  {b.edit}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{fill(b.filled, { n: filled, total: count })}</h3>
                  {byCreator > 0 && <p className="text-xs text-muted">{fill(b.filledSplit, { own: filled - byCreator, creator: byCreator })}</p>}
                </div>
                <Button size="sm" variant="ghost" icon={<Pencil size={15} />} onClick={() => goTo(2)}>
                  {b.edit}
                </Button>
              </div>
              <ol className="max-h-80 divide-y divide-line overflow-y-auto">
                {visible.map((s, i) =>
                  isFilled(s) ? (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          setActive(i)
                          goTo(2)
                        }}
                        className="flex w-full gap-3 px-5 py-2.5 text-left text-sm hover:bg-surface-muted"
                      >
                        <span className="w-6 shrink-0 pt-px text-right text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                        {s.creatorPicks ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sunny-100 px-2.5 py-0.5 text-xs font-medium text-ink">
                            <Sparkles size={13} aria-hidden /> {b.creatorBadge}
                          </span>
                        ) : (
                          <span className="min-w-0">
                            <span className={cn('block font-medium', !s.word.trim() && 'font-normal text-muted')}>{s.word.trim() || c.card.noWord}</span>
                            {s.style.trim() && <span className="block truncate text-muted">{s.style}</span>}
                          </span>
                        )}
                      </button>
                    </li>
                  ) : null,
                )}
              </ol>
            </section>

            <TextField
              label={b.nickname}
              optional
              hint={b.nicknameHint}
              value={draft.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              maxChars={LIMITS.nickname}
              error={errText(errors.fields.nickname)}
              autoComplete="nickname"
            />
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-5">
        {step > 1 ? (
          <Button variant="secondary" icon={<ChevronLeft size={18} />} onClick={() => goTo((step - 1) as Step)}>
            {b.back}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon={<RotateCcw size={15} />} onClick={() => void reset()}>
            {b.reset}
          </Button>
        )}
        <p className="hidden text-xs text-muted sm:block">{b.draftSaved}</p>
        {step < 3 ? (
          <Button type="submit" variant="primary" iconRight={<ChevronRight size={18} />} className="min-w-32">
            {b.nextStep}
          </Button>
        ) : (
          <Button type="submit" variant="primary" loading={submitting} icon={<Send size={17} />}>
            {b.submit}
          </Button>
        )}
      </div>
    </form>
  )
}

/* ---------- Step milestones ---------- */

type Step = 1 | 2 | 3
type FieldKey = keyof SuggestionErrors['fields']
interface Milestone {
  title: string
  detail: string
}

const STEP_FIELDS: Record<Step, FieldKey[]> = {
  1: ['nameTh', 'nameEn', 'descTh', 'descEn'],
  2: ['stickers'],
  3: ['nickname'],
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 1 —— 2 —— 3 progress bar. Done steps show a check; any step can be clicked. */
function StepMilestones({ steps, current, onStep }: { steps: Milestone[]; current: Step; onStep: (s: Step) => void }) {
  const b = useCopy().builder
  return (
    <nav aria-label={b.stepsLabel}>
      <ol className="grid grid-cols-3">
        {steps.map((s, i) => {
          const n = (i + 1) as Step
          const done = n < current
          const on = n === current
          return (
            <li key={n} className="relative min-w-0">
              {/* connector to the next milestone */}
              {i < steps.length - 1 && (
                <span
                  className="studio-line absolute top-4 left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] overflow-hidden rounded-full bg-line"
                  style={{ '--d': `${400 + i * 150}ms` } as React.CSSProperties}
                  aria-hidden
                >
                  <span className={cn('block h-full bg-brown transition-[width] duration-300', done ? 'w-full' : 'w-0')} />
                </span>
              )}
              <button
                type="button"
                onClick={() => onStep(n)}
                aria-current={on ? 'step' : undefined}
                className="group flex w-full flex-col items-center gap-2 rounded-xl px-1 text-center"
              >
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                    done && 'bg-brown text-cream',
                    on && 'bg-brown text-cream ring-4 ring-brown/10',
                    !done && !on && 'border border-line-strong bg-surface text-muted group-hover:border-brown group-hover:text-ink',
                  )}
                  aria-hidden
                >
                  {done ? <Check size={16} strokeWidth={2.75} /> : n}
                </span>
                <span className="min-w-0">
                  <span className="sr-only">{fill(b.stepOf, { n, total: steps.length })}: </span>
                  <span className={cn('block truncate text-xs font-semibold sm:text-sm', on ? 'text-ink' : done ? 'text-ink' : 'text-muted')}>{s.title}</span>
                  <span className="hidden truncate text-xs text-muted sm:block">{s.detail}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function BulkWords({ onApply }: { onApply: (text: string) => number }) {
  const b = useCopy().builder
  const [text, setText] = useState('')
  return (
    <details className="group mt-4 rounded-2xl border border-line">
      <summary className="flex min-h-11 list-none items-center gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ListPlus size={17} aria-hidden /> {b.bulkTitle}
        <ChevronRight size={16} className="ml-auto transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <TextArea label={b.bulkTitle} hint={b.bulkHint} placeholder={b.bulkPh} value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        <Button
          size="sm"
          variant="accent"
          disabled={!text.trim()}
          onClick={() => {
            const n = onApply(text)
            if (n > 0) {
              toast.success(fill(b.bulkDone, { n }))
              setText('')
            } else toast.warning(b.bulkNoRoom)
          }}
        >
          {b.bulkApply}
        </Button>
      </div>
    </details>
  )
}
