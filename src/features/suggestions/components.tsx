import { Heart, Plus, Send, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField, inputClass } from '@/components/ui/Field'
import { fill, useCopy } from '@/features/portal/copy'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { textLength } from '@/lib/validation/brief'
import {
  ERROR_LIMIT,
  LIMITS,
  MOODS,
  moodEmoji,
  validateSuggestion,
  type Suggestion,
  type SuggestionErrorCode,
  type SuggestionErrors,
  type SuggestionInput,
} from './model'

const EMPTY: SuggestionInput = { title: '', mood: 'cute', description: '', captions: [], nickname: '' }

/** Turns an error code into a message in the current language. */
function useErrorText() {
  const c = useCopy()
  return (code?: SuggestionErrorCode) => (code ? fill(c.errors[code], { max: ERROR_LIMIT[code] }) : undefined)
}

export function SuggestionForm({ onSubmit, submitting }: { onSubmit: (input: SuggestionInput) => Promise<unknown>; submitting: boolean }) {
  const c = useCopy()
  const errText = useErrorText()
  const [value, setValue] = useState<SuggestionInput>(EMPTY)
  const [draftCaption, setDraftCaption] = useState('')
  const [errors, setErrors] = useState<SuggestionErrors>({})
  const [captionError, setCaptionError] = useState<SuggestionErrorCode>()
  const captionId = useId()
  const titleRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof SuggestionInput>(k: K, v: SuggestionInput[K]) => {
    setValue((old) => ({ ...old, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const addCaption = () => {
    const cap = draftCaption.trim()
    if (!cap) return
    if (textLength(cap) > LIMITS.caption) return setCaptionError('captionTooLong')
    if (value.captions.length >= LIMITS.captions) return setCaptionError('tooManyCaptions')
    if (value.captions.includes(cap)) return setCaptionError('duplicateCaption')
    set('captions', [...value.captions, cap])
    setDraftCaption('')
    setCaptionError(undefined)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // A phrase still sitting in the box counts too.
    const pending = draftCaption.trim()
    const input = pending && !value.captions.includes(pending) ? { ...value, captions: [...value.captions, pending] } : value
    const errs = validateSuggestion(input)
    if (Object.keys(errs).length) {
      setErrors(errs)
      if (errs.title) titleRef.current?.focus()
      return
    }
    try {
      await onSubmit(input)
    } catch {
      return // keep what they typed; the page shows the error
    }
    setValue(EMPTY)
    setDraftCaption('')
  }

  const captionMsg = errText(captionError ?? errors.captions)

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <TextField
        ref={titleRef}
        label={c.form.title}
        placeholder={c.form.titlePh}
        value={value.title}
        onChange={(e) => set('title', e.target.value)}
        maxChars={LIMITS.title}
        error={errText(errors.title)}
        required
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{c.form.mood}</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <label
              key={m.id}
              className={cn(
                'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                value.mood === m.id ? 'border-brown bg-brown text-cream' : 'border-line-strong bg-surface hover:bg-surface-muted',
              )}
            >
              <input type="radio" name="mood" value={m.id} checked={value.mood === m.id} onChange={() => set('mood', m.id)} className="sr-only" />
              <span aria-hidden>{m.emoji}</span>
              {c.moods[m.id]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor={captionId} className="text-sm font-medium">
            {c.form.captions} <span className="text-xs font-normal text-muted">{c.form.optional}</span>
          </label>
          <span className="text-xs text-muted tabular-nums">
            {value.captions.length}/{LIMITS.captions}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            id={captionId}
            className={cn(inputClass, 'h-11')}
            placeholder={c.form.captionPh}
            value={draftCaption}
            autoComplete="off"
            aria-invalid={!!captionMsg || undefined}
            aria-describedby={`${captionId}-msg`}
            onChange={(e) => {
              setDraftCaption(e.target.value)
              setCaptionError(undefined)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                addCaption()
              }
            }}
          />
          <Button iconOnly label={c.form.addCaption} icon={<Plus size={18} />} onClick={addCaption} disabled={!draftCaption.trim()} />
        </div>
        <p id={`${captionId}-msg`} className={cn('mt-1.5', captionMsg ? 'text-sm text-danger' : 'text-xs text-muted')}>
          {captionMsg ?? fill(c.form.captionHint, { max: LIMITS.captions, len: LIMITS.caption })}
        </p>
        {value.captions.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={c.form.captionsAdded}>
            {value.captions.map((cap) => (
              <li key={cap} className="inline-flex items-center gap-1 rounded-full bg-sunny-100 py-1 pr-1 pl-3 text-sm">
                {cap}
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-sunny-200"
                  aria-label={fill(c.form.removeCaption, { c: cap })}
                  onClick={() => set('captions', value.captions.filter((x) => x !== cap))}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TextArea
        label={c.form.description}
        optional
        placeholder={c.form.descriptionPh}
        value={value.description}
        onChange={(e) => set('description', e.target.value)}
        maxChars={LIMITS.description}
        error={errText(errors.description)}
        rows={3}
      />

      <TextField
        label={c.form.nickname}
        optional
        hint={c.form.nicknameHint}
        value={value.nickname}
        onChange={(e) => set('nickname', e.target.value)}
        maxChars={LIMITS.nickname}
        error={errText(errors.nickname)}
        autoComplete="nickname"
      />

      <Button type="submit" variant="primary" size="lg" block loading={submitting} icon={<Send size={18} />}>
        {c.form.submit}
      </Button>
    </form>
  )
}

export function SuggestionCard({ s, onVote, voting, highlight }: { s: Suggestion; onVote: () => void; voting: boolean; highlight?: boolean }) {
  const c = useCopy()
  const locale = useLocale()
  const date = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(s.createdAt))
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-3xl border bg-surface p-5 transition-shadow',
        highlight ? 'border-brown shadow-md ring-4 ring-sunny-200' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 font-medium">
          <span aria-hidden>{moodEmoji(s.mood)}</span> {c.moods[s.mood]}
        </span>
        {s.mine ? (
          <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-medium text-mint-700">{c.card.yours}</span>
        ) : s.isExample ? (
          <span className="text-xs text-muted">{c.card.example}</span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-xl leading-snug">{s.title}</h3>
      {s.description && <p className="mt-1.5 text-[15px] text-muted">{s.description}</p>}
      {s.captions.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={c.card.captionsLabel}>
          {s.captions.map((cap) => (
            <li key={cap} className="rounded-xl bg-sunny-100 px-2.5 py-1 text-sm">
              {cap}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="min-w-0 truncate text-xs text-muted">
          {s.nickname ? fill(c.card.by, { name: s.nickname }) : c.card.anonymous} · {date}
        </p>
        <button
          type="button"
          aria-pressed={s.votedByMe}
          disabled={voting}
          onClick={onVote}
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
            s.votedByMe ? 'border-peach-700/25 bg-peach-100 text-peach-700' : 'border-line-strong hover:bg-surface-muted',
          )}
        >
          <Heart size={17} fill={s.votedByMe ? 'currentColor' : 'none'} aria-hidden />
          {s.votedByMe ? c.card.wanted : c.card.want}
          <span className="tabular-nums" aria-label={fill(c.card.votes, { n: s.votes })}>
            {s.votes}
          </span>
        </button>
      </div>
    </article>
  )
}
