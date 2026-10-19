import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ExternalLink, HelpCircle, Inbox, Lock, PenLine } from 'lucide-react'
import { useParams } from 'react-router'
import { Alert, Card, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/LinkButton'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { track } from '@/lib/analytics'
import { isBriefLocked, statusLabel } from '@/lib/domain/status'
import { formatDate, formatRelative } from '@/lib/utils/format'
import { pad2 } from '@/lib/utils/id'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { EventLog, MilestoneTrack } from './components'

export default function RequestDetailPage() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: qk.request(id), queryFn: () => api.requests.getRequest(id) })
  const pkgs = useQuery({ queryKey: qk.packages, queryFn: () => api.requests.getPackages(), enabled: q.data?.channel === 'commission' })
  usePageMeta(q.data ? `${q.data.id} ${q.data.setName}` : 'คำขอ', undefined, { noindex: true })

  if (q.isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )
  if (q.isError)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Page>
    )

  const r = q.data
  const pkg = pkgs.data?.find((p) => p.id === r.packageId)
  const lastAdminMsg = [...r.timeline].reverse().find((e) => e.actor === 'admin' && e.message)
  const locked = isBriefLocked(r.status)
  const hasProof = ['proof_ready', 'revision_requested', 'artwork_approved', 'line_submitted', 'published', 'closed'].includes(r.status) && r.channel === 'commission'

  return (
    <Page>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} channel={r.channel} />
          <ChannelBadge channel={r.channel} />
          <span className="text-sm text-muted">{r.id}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl break-words" lang="th">
          {r.setName || 'ฉบับร่างยังไม่ตั้งชื่อ'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {r.stickerCount} ภาพ{pkg && ` · แพ็กเกจ ${pkg.stickerCount} ภาพ (${pkg.revisionRounds} รอบแก้)`}
          {r.fastworkReference && ` · Fastwork ${r.fastworkReference}`} · อัปเดต {formatRelative(r.updatedAt)}
        </p>
      </header>

      {/* The single most relevant next action for the customer. */}
      <div className="mb-6 space-y-3">
        {r.status === 'draft' && (
          <Alert tone="info" icon={<PenLine size={18} />} title="ยังเป็นฉบับร่าง" actions={<LinkButton to={`/my/requests/${r.id}/edit`} variant="primary" size="sm">ทำบรีฟต่อ</LinkButton>}>
            ฉบับร่างซิงก์ไว้ในบัญชีแล้ว เปิดต่อจากอุปกรณ์ไหนก็ได้
          </Alert>
        )}
        {r.status === 'clarification_requested' && (
          <Alert
            tone="warning"
            icon={<HelpCircle size={18} />}
            title="ทีมงานขอข้อมูลเพิ่ม"
            actions={
              <LinkButton to={`/my/requests/${r.id}/edit`} variant="primary" size="sm">
                แก้ไขและส่งอีกครั้ง
              </LinkButton>
            }
          >
            <p className="whitespace-pre-wrap" lang="th">
              {lastAdminMsg?.message}
            </p>
          </Alert>
        )}
        {r.status === 'proof_ready' && (
          <Alert
            tone="warning"
            icon={<Inbox size={18} />}
            title="งานพร้อมให้ตรวจแล้ว"
            actions={
              <LinkButton to={`/my/requests/${r.id}/proof`} variant="primary" size="sm" iconRight={<ArrowRight size={16} />}>
                ตรวจงาน
              </LinkButton>
            }
          >
            อนุมัติหรือขอแก้ไขได้ทีละภาพ เมื่ออนุมัติครบทุกภาพแล้วจึงอนุมัติทั้งชุดได้
          </Alert>
        )}
        {r.status === 'declined' && lastAdminMsg && (
          <Alert tone="danger" title={statusLabel('declined', r.channel)}>
            <p className="whitespace-pre-wrap" lang="th">
              {lastAdminMsg.message}
            </p>
          </Alert>
        )}
        {r.status === 'published' && r.lineStoreUrl && (
          <Alert
            tone="success"
            title="วางขายใน LINE Sticker Store แล้ว"
            actions={
              <a
                href={r.lineStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('sticker_store_clicked', { request: r.id })}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success px-3 text-sm font-medium text-white"
              >
                เปิดใน LINE Store <ExternalLink size={14} aria-hidden />
              </a>
            }
          >
            {r.catalogCode && `รหัสชุด ${r.catalogCode} · `}ขอบคุณที่ร่วมสร้างสรรค์!
          </Alert>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">บรีฟ</h2>
              {locked && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Lock size={14} aria-hidden /> อ่านอย่างเดียว
                </span>
              )}
            </div>
            {r.theme && (
              <p className="mb-4 text-sm whitespace-pre-wrap" lang="th">
                <span className="text-muted">ธีม: </span>
                {r.theme}
              </p>
            )}
            <ol className="divide-y divide-line">
              {r.items.slice(0, r.stickerCount).map((it) => (
                <li key={it.id} className="flex gap-3 py-3">
                  <span className="w-7 shrink-0 font-display text-muted tabular-nums">{pad2(it.position)}</span>
                  <div className="min-w-0">
                    <p className="font-display break-words whitespace-pre-wrap" lang="th">
                      {it.caption || '—'}
                    </p>
                    <p className="mt-0.5 text-sm text-muted" lang="th">
                      {it.pose}
                    </p>
                    {it.clothingProps && (
                      <p className="mt-0.5 text-xs text-muted" lang="th">
                        เครื่องแต่งกาย/พร็อพ: {it.clothingProps}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-4 font-display text-xl">ความเคลื่อนไหว</h2>
            <EventLog events={r.timeline} />
          </Card>
        </div>
        {/* Status first on phones; right column on desktop. */}
        <aside className="order-first space-y-6 lg:order-none">
          <Card>
            <h2 className="mb-4 font-display text-lg">สถานะ</h2>
            <MilestoneTrack request={r} />
          </Card>
          {hasProof && (
            <LinkButton to={`/my/requests/${r.id}/proof`} variant="secondary" block>
              ดูงานทั้งหมด (proof)
            </LinkButton>
          )}
          <Card className="text-sm">
            <dl className="space-y-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">สร้างเมื่อ</dt>
                <dd>{formatDate(r.createdAt)}</dd>
              </div>
              {r.submittedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">ส่งเมื่อ</dt>
                  <dd>{formatDate(r.submittedAt)}</dd>
                </div>
              )}
              {r.termsVersion && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">ข้อกำหนดที่ยอมรับ</dt>
                  <dd>ฉบับ {r.termsVersion}</dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </Page>
  )
}
