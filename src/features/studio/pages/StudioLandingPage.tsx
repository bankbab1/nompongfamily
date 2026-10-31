import { ArrowRight, Check, ClipboardList, Eye, PenLine, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCurrentUser } from '@/features/auth/useAuth'
import { track } from '@/lib/analytics'
import { localDrafts } from '@/lib/storage/drafts'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { CHANNEL_INFO, PUBLIC_DISCLOSURE } from '../content'
import { completedCount, type LocalDraft } from '../model/draft'

const HOW = [
  { icon: ClipboardList, title: 'กรอกบรีฟ', body: 'ตั้งชื่อชุด เลือก 8–40 ภาพ ใส่ข้อความและท่าทางทีละภาพ บันทึกอัตโนมัติ' },
  { icon: Eye, title: 'ทีมงานพิจารณา', body: 'ทีมงานอ่านบรีฟ อาจขอข้อมูลเพิ่ม แล้วแจ้งผลในหน้าคำขอ' },
  { icon: PenLine, title: 'วาดและตรวจงาน', body: 'ไอเดียที่ได้รับเลือกจะวาดในสไตล์นมผง และตรวจทุกภาพก่อนวางขาย' },
  { icon: Store, title: 'วางขายสาธารณะ', body: 'ชุดที่เสร็จจะส่งให้ LINE พิจารณาและวางขายใน LINE Sticker Store' },
]

export default function StudioLandingPage() {
  const user = useCurrentUser()
  const [drafts, setDrafts] = useState<LocalDraft[]>([])
  usePageMeta('Nompong Studio', 'เสนอไอเดียชุดสติกเกอร์นมผงฟรี ทีมงานพิจารณาทุกไอเดีย')

  useEffect(() => {
    track('studio_opened')
    localDrafts.listFor(user?.id ?? null).then((all) => setDrafts(all.filter((d) => !d.serverId).slice(0, 3)))
  }, [user?.id])

  return (
    <>
      <section>
        <Page className="pt-10 pb-6 sm:pt-16">
          <p className="text-sm font-medium text-muted">Nompong Studio</p>
          <h1 className="t-page mt-2 max-w-2xl font-display">เสนอไอเดียชุดสติกเกอร์นมผง</h1>
          <p className="t-lead mt-3 max-w-xl">ฟรี กรอกง่ายบนมือถือ บันทึกอัตโนมัติ และไม่หายแม้รีเฟรชหน้า</p>
        </Page>
      </section>

      <Page>
        {drafts.length > 0 && (
          <section aria-labelledby="resume" className="mb-8">
            <h2 id="resume" className="mb-3 font-display text-xl">
              ทำต่อจากที่ค้างไว้
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((d) => (
                <li key={d.clientDraftId}>
                  <Link
                    to={`/studio/new?type=${d.data.channel}&draft=${d.clientDraftId}`}
                    className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong"
                  >
                    <PenLine size={20} className="shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium" lang="th">
                        {d.data.setName || 'ฉบับร่างยังไม่ตั้งชื่อ'}
                      </span>
                      <span className="block text-xs text-muted">
                        {completedCount(d.data)}/{d.data.stickerCount} ภาพ · {formatRelative(d.updatedAt)}
                      </span>
                    </span>
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <article className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl">{CHANNEL_INFO.community.title}</h2>
            <p className="mt-1 text-muted">{CHANNEL_INFO.community.summary}</p>
            <ul className="mt-4 space-y-2">
              {CHANNEL_INFO.community.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <Check size={18} className="mt-0.5 shrink-0 text-success" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </div>
          <LinkButton
            to="/studio/new"
            variant="primary"
            size="lg"
            iconRight={<ArrowRight size={18} />}
            onClick={() => track('request_type_selected', { channel: 'community' })}
          >
            เสนอไอเดีย
          </LinkButton>
        </article>

        <Alert tone="info" className="mt-6" title={PUBLIC_DISCLOSURE.title}>
          {PUBLIC_DISCLOSURE.body}
        </Alert>

        <section aria-labelledby="how" className="mt-12">
          <h2 id="how" className="t-section font-display">
            ขั้นตอนการทำงาน
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map((s, i) => (
              <li key={s.title} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunny font-display">{i + 1}</span>
                  <s.icon size={20} className="text-muted" aria-hidden />
                </div>
                <h3 className="mt-3 font-display text-lg">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </Page>
    </>
  )
}
