import { ChevronDown, Heart, Sparkles } from 'lucide-react'
import { useId, useState } from 'react'
import { fill, useCopy } from '@/lib/copy'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { isFilled, localDesc, localName, type Suggestion } from './model'
import { MoodIcon } from './MoodIcon'

const PREVIEW_WORDS = 6

export function SuggestionCard({ s, onVote, voting, highlight }: { s: Suggestion; onVote: () => void; voting: boolean; highlight?: boolean }) {
  const c = useCopy()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const listId = useId()
  const name = localName(s, locale)
  const desc = localDesc(s, locale)
  const words = s.stickers
    .filter((x) => !x.creatorPicks)
    .map((x) => x.word.trim())
    .filter(Boolean)
  const detailed = s.stickers.filter(isFilled).length
  const date = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(s.createdAt))

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-3xl border bg-surface p-5 transition-shadow',
        highlight ? 'border-brown ring-4 ring-brown/10' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="inline-flex items-center rounded-full bg-brown px-2.5 py-0.5 text-xs font-semibold text-cream tabular-nums">
          {fill(c.card.count, { n: s.stickerCount })}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 font-medium">
          <MoodIcon id={s.mood} size={13} /> {c.moods[s.mood]}
        </span>
        {s.mine ? (
          <span className="ml-auto rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">{c.card.yours}</span>
        ) : s.isExample ? (
          <span className="ml-auto text-xs text-muted">{c.card.example}</span>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-xl leading-snug">{name.main}</h3>
      {name.alt && <p className="text-sm text-muted">{name.alt}</p>}
      {desc && <p className="mt-1.5 text-[15px] text-muted">{desc}</p>}

      {words.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={c.card.captionsLabel}>
          {words.slice(0, PREVIEW_WORDS).map((w, i) => (
            <li key={`${w}-${i}`} className="rounded-full bg-surface-muted px-2.5 py-1 text-sm">
              {w}
            </li>
          ))}
          {words.length > PREVIEW_WORDS && (
            <li className="rounded-xl px-1.5 py-1 text-sm text-muted">{fill(c.card.more, { n: words.length - PREVIEW_WORDS })}</li>
          )}
        </ul>
      )}

      {detailed > 0 && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex min-h-10 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            {open ? c.card.showLess : c.card.showAll}
            <span className="text-muted">· {fill(c.card.detailed, { n: detailed })}</span>
            <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
          {open && (
            <ol id={listId} className="mt-2 divide-y divide-line rounded-2xl border border-line">
              {s.stickers.map((x, i) =>
                isFilled(x) ? (
                  <li key={i} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-6 shrink-0 pt-px text-right text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                    {x.creatorPicks ? (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Sparkles size={13} aria-hidden /> {c.builder.creatorBadge}
                      </span>
                    ) : (
                      <span className="min-w-0">
                        <span className={cn('block font-medium', !x.word.trim() && 'font-normal text-muted')}>{x.word.trim() || c.card.noWord}</span>
                        {x.style.trim() && <span className="block text-muted">{x.style}</span>}
                      </span>
                    )}
                  </li>
                ) : null,
              )}
            </ol>
          )}
        </div>
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
            s.votedByMe ? 'border-transparent bg-peach-100 text-peach-700' : 'border-line hover:border-line-strong',
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
