import { ChevronRight, ListPlus, RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { TextArea, TextField } from '@/components/ui/Field'
import { fill, useCopy } from '@/features/portal/copy'
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
  stickerCount: 8,
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
    return { ...d, stickers, stickerCount: STICKER_COUNTS.includes(d.stickerCount) ? d.stickerCount : 8 }
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

  useEffect(() => saveDraft(draft), [draft])

  const count = draft.stickerCount
  const visible = draft.stickers.slice(0, count)
  const filled = visible.filter(isFilled).length
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
      if (!stickers[i].word.trim()) stickers[i] = { ...stickers[i], word: words[used++] }
    }
    if (used) setDraft({ ...draft, stickers })
    return used
  }

  const reset = async () => {
    const ok = await confirm({ title: b.resetConfirm, confirmLabel: b.reset, cancelLabel: b.cancel, tone: 'danger' })
    if (!ok) return
    setDraft(freshDraft())
    setErrors(EMPTY_ERRORS)
    setActive(0)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input: SuggestionInput = { ...draft, stickers: visible }
    const errs = validateSuggestion(input)
    if (hasErrors(errs)) {
      setErrors(errs)
      const firstBad = Object.keys(errs.stickers).map(Number).sort((x, y) => x - y)[0]
      if (errs.fields.nameTh || errs.fields.nameEn) nameRef.current?.focus()
      else if (firstBad !== undefined) setActive(firstBad)
      toast.error(c.suggest.fixErrors)
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
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        {/* Step 1: set details */}
        <fieldset className="min-w-0 space-y-5">
          <legend className="mb-4 flex items-center gap-2 font-display text-xl">
            <StepBadge n={1} /> {b.step1}
          </legend>

          <div>
            <p className="mb-2 text-sm font-medium" id="count-label">
              {b.count}
            </p>
            <div role="radiogroup" aria-labelledby="count-label" className="grid grid-cols-5 gap-2">
              {STICKER_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={count === n}
                  onClick={() => changeCount(n)}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center rounded-2xl border text-lg leading-none font-semibold tabular-nums transition-colors',
                    count === n ? 'border-brown bg-brown text-cream' : 'border-line-strong bg-surface hover:bg-surface-muted',
                  )}
                >
                  {n}
                  <span className={cn('mt-1 text-[10px] font-medium', count === n ? 'text-cream/75' : 'text-muted')}>{fill(b.countUnit, { n: '' }).trim()}</span>
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
              placeholder={b.namePhTh}
              value={draft.nameTh}
              onChange={(e) => set('nameTh', e.target.value)}
              maxChars={LIMITS.name}
              error={errText(errors.fields.nameTh)}
              hint={b.nameHint}
            />
            <TextField
              lang="en"
              label={b.nameEn}
              placeholder={b.namePhEn}
              value={draft.nameEn}
              onChange={(e) => set('nameEn', e.target.value)}
              maxChars={LIMITS.name}
              error={errText(errors.fields.nameEn)}
              hint={b.nameHint}
            />
            <TextArea
              lang="th"
              label={b.descTh}
              optional
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
              optional
              placeholder={b.descPhEn}
              value={draft.descEn}
              onChange={(e) => set('descEn', e.target.value)}
              maxChars={LIMITS.desc}
              error={errText(errors.fields.descEn)}
              rows={3}
            />
          </div>
          <p className="-mt-2 text-xs text-muted">{fill(b.lineHint, { name: LIMITS.name, desc: LIMITS.desc })}</p>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{b.mood}</legend>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                    draft.mood === m.id ? 'border-brown bg-brown text-cream' : 'border-line-strong bg-surface hover:bg-surface-muted',
                  )}
                >
                  <input type="radio" name="mood" value={m.id} checked={draft.mood === m.id} onChange={() => set('mood', m.id)} className="sr-only" />
                  <span aria-hidden>{m.emoji}</span>
                  {c.moods[m.id]}
                </label>
              ))}
            </div>
          </fieldset>

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
        </fieldset>

        {/* Step 2: each sticker */}
        <fieldset className="min-w-0">
          <legend className="mb-1 flex w-full items-center gap-2 font-display text-xl">
            <StepBadge n={2} /> {b.step2}
          </legend>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">{b.stickersHint}</p>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', filled ? 'bg-mint-100 text-mint-700' : 'bg-surface-muted text-muted')}>
              {fill(b.filled, { n: filled, total: count })}
            </span>
          </div>

          <StickerPager active={active} total={count} onGo={setActive} />
          <StickerStrip stickers={visible} active={active} onSelect={setActive} errorAt={errors.stickers} />
          {errors.fields.stickers && <p className="mt-2 text-sm text-danger">{errText(errors.fields.stickers)}</p>}
          {hiddenFilled && <p className="mt-2 text-xs text-muted">{fill(b.hiddenNote, { from: count + 1, to: MAX_STICKERS })}</p>}

          <StickerCarousel
            stickers={visible}
            active={active}
            onActive={setActive}
            errorsAt={errors.stickers}
            onChange={setSticker}
          />

          <BulkWords onApply={bulkFill} />
        </fieldset>
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <p className="text-xs text-muted">{b.draftSaved}</p>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={15} />} onClick={() => void reset()}>
            {b.reset}
          </Button>
        </div>
        <Button type="submit" variant="primary" size="lg" loading={submitting} icon={<Send size={18} />}>
          {b.submit}
        </Button>
      </div>
    </form>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sunny text-sm font-semibold text-ink" aria-hidden>
      {n}
    </span>
  )
}

function BulkWords({ onApply }: { onApply: (text: string) => number }) {
  const b = useCopy().builder
  const [text, setText] = useState('')
  return (
    <details className="group mt-4 rounded-2xl border border-line bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
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
