import { ChevronLeft, Heart, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AdminIdeaDetailSkeleton } from '@/components/feedback/Skeletons'
import { Card, EmptyState, ErrorState } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Field'
import { MoodIcon } from '@/features/suggestions/MoodIcon'
import { IDEA_STATUS_INFO, IdeaStatusBadge } from '@/features/suggestions/IdeaStatus'
import { IDEA_STATUSES, isFilled, NOTE_LIMIT, type IdeaStatus } from '@/features/suggestions/model'
import { useSetIdeaStatus, useSuggestions } from '@/features/suggestions/useSuggestions'
import { LINE_SETS } from '@/features/stickers/lineStore'
import { useCopy } from '@/lib/copy'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/** One fan idea in full, with the status the fan sees and an optional note to them. */
export default function IdeaDetailPage() {
  const { id = '' } = useParams()
  const ideas = useSuggestions()
  const idea = ideas.data?.find((i) => i.id === id)
  const save = useSetIdeaStatus()
  const c = useCopy()
  usePageMeta(idea ? idea.nameTh || idea.nameEn : 'ไอเดีย', undefined, { noindex: true })

  const [status, setStatus] = useState<IdeaStatus>('pending')
  const [note, setNote] = useState('')
  const [lineSetId, setLineSetId] = useState('')
  // Load the saved values once the idea arrives (and again if another idea opens).
  useEffect(() => {
    if (!idea) return
    setStatus(idea.status)
    setNote(idea.statusNote)
    setLineSetId(idea.lineSetId ?? '')
  }, [idea?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (ideas.isPending) return <AdminIdeaDetailSkeleton />
  if (ideas.isError) return <ErrorState error={ideas.error} onRetry={() => ideas.refetch()} />
  if (!idea) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink />
        <EmptyState title="ไม่พบไอเดียนี้" description="อาจถูกลบ หรือถูกส่งจากอุปกรณ์อื่น (ตอนนี้ข้อมูลยังเก็บแยกในแต่ละเครื่อง)" />
      </div>
    )
  }

  const dirty = status !== idea.status || note.trim() !== idea.statusNote || (status === 'published' && lineSetId !== (idea.lineSetId ?? ''))
  const linked = LINE_SETS.find((s) => s.id === lineSetId)

  const submit = () => {
    if (status === 'published' && !lineSetId) {
      toast.error('เลือกชุดใน LINE ที่วางขายก่อนนะ ผู้ส่งจะได้กดดูได้')
      return
    }
    save.mutate(
      { id: idea.id, update: { status, note, lineSetId } },
      {
        onSuccess: () => toast.success(`เปลี่ยนสถานะเป็น “${IDEA_STATUS_INFO[status].label.th}” แล้ว`),
        onError: () => toast.error('บันทึกไม่สำเร็จ ลองอีกครั้ง'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* The idea as the fan sent it */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <IdeaStatusBadge status={idea.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 font-medium">
                <MoodIcon id={idea.mood} size={13} /> {c.moods[idea.mood]}
              </span>
              <span className="inline-flex items-center gap-1 text-muted tabular-nums">
                <Heart size={14} aria-hidden /> {idea.votes} คนอยากได้
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl" lang="th">
              {idea.nameTh || idea.nameEn}
            </h1>
            {idea.nameTh && idea.nameEn && <p className="text-muted">{idea.nameEn}</p>}
            {(idea.descTh || idea.descEn) && (
              <dl className="mt-4 space-y-2 text-[15px]">
                {idea.descTh && (
                  <div>
                    <dt className="text-xs text-muted">คำอธิบาย (ไทย)</dt>
                    <dd lang="th">{idea.descTh}</dd>
                  </div>
                )}
                {idea.descEn && (
                  <div>
                    <dt className="text-xs text-muted">คำอธิบาย (อังกฤษ)</dt>
                    <dd lang="en">{idea.descEn}</dd>
                  </div>
                )}
              </dl>
            )}
            <p className="mt-4 text-xs text-muted">
              ส่งโดย {idea.nickname || 'ไม่ระบุชื่อ'} · {formatDateTime(idea.createdAt)}
              {idea.isExample && ' · ไอเดียตัวอย่าง'}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-lg">
              สติกเกอร์ {idea.stickers.filter(isFilled).length}/{idea.stickerCount} ภาพ
            </h2>
            <ol className="divide-y divide-line">
              {idea.stickers.map((s, n) => (
                <li key={n} className="flex gap-3 py-2.5 text-sm">
                  <span className="w-6 shrink-0 pt-px text-right text-xs font-semibold text-muted tabular-nums">{n + 1}</span>
                  {s.creatorPicks ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunny-100 px-2.5 py-0.5 text-xs font-medium">
                      <Sparkles size={13} aria-hidden /> ให้ครีเอเตอร์ออกแบบ
                    </span>
                  ) : isFilled(s) ? (
                    <span className="min-w-0">
                      <span className={cn('block font-medium', !s.word.trim() && 'font-normal text-muted')}>{s.word.trim() || '(ไม่มีคำ)'}</span>
                      {s.style.trim() && <span className="block text-muted">{s.style}</span>}
                    </span>
                  ) : (
                    <span className="text-muted">ว่าง</span>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Status the fan sees */}
        <Card className="lg:sticky lg:top-20">
          <h2 className="font-display text-lg">สถานะ</h2>
          <p className="mt-0.5 text-sm text-muted">ผู้ส่งจะเห็นสถานะและข้อความนี้ในการ์ดไอเดียและ My Nompong</p>

          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">เลือกสถานะ</legend>
            {IDEA_STATUSES.map((s) => {
              const info = IDEA_STATUS_INFO[s]
              const on = status === s
              return (
                <label
                  key={s}
                  className={cn(
                    'flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                    on ? 'border-brown bg-surface-muted' : 'border-line hover:border-line-strong',
                  )}
                >
                  <input type="radio" name="status" value={s} checked={on} onChange={() => setStatus(s)} className="sr-only" />
                  <info.icon size={18} className={on ? 'text-ink' : 'text-muted'} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{info.label.th}</span>
                    <span className="block text-xs text-muted">{info.hint.th}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'h-4 w-4 shrink-0 rounded-full border-2',
                      on ? 'border-brown bg-brown shadow-[inset_0_0_0_2px_var(--surface)]' : 'border-line-strong',
                    )}
                  />
                </label>
              )
            })}
          </fieldset>

          {status === 'published' && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium">ชุดใน LINE ที่วางขาย</span>
              <select
                value={lineSetId}
                onChange={(e) => setLineSetId(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm focus:border-brown focus:outline-none"
              >
                <option value="">เลือกชุด…</option>
                {LINE_SETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              {linked && (
                <Link to={`/stickers/${linked.id}`} target="_blank" className="mt-1.5 inline-block text-xs font-medium underline-offset-2 hover:underline">
                  เปิดดูหน้าชุดนี้
                </Link>
              )}
            </label>
          )}

          <TextArea
            wrapperClassName="mt-4"
            label="ข้อความถึงผู้ส่ง"
            optional
            hint="เช่น ขอบคุณ หรือบอกเหตุผลสั้นๆ ผู้ส่งเท่านั้นที่เห็น"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxChars={NOTE_LIMIT}
            rows={3}
          />

          <Button variant="primary" block className="mt-4" loading={save.isPending} disabled={!dirty} onClick={submit}>
            บันทึกสถานะ
          </Button>
          {idea.statusAt && <p className="mt-2 text-center text-xs text-muted">อัปเดตล่าสุด {formatDateTime(idea.statusAt)}</p>}
        </Card>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/admin/ideas" className="-ml-1 mb-4 inline-flex min-h-10 items-center gap-1 rounded-full pr-3 text-sm font-medium text-muted hover:text-ink">
      <ChevronLeft size={18} aria-hidden /> ไอเดียทั้งหมด
    </Link>
  )
}
