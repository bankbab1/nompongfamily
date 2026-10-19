import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Briefcase, Check, ClipboardList, Eye, Lightbulb, MessageSquareText, PenLine, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCurrentUser } from '@/features/auth/useAuth'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { track } from '@/lib/analytics'
import { localDrafts } from '@/lib/storage/drafts'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { CHANNEL_INFO, PUBLIC_DISCLOSURE } from '../content'
import { completedCount, type LocalDraft } from '../model/draft'

const HOW = [
  { icon: ClipboardList, title: 'กรอกบรีฟ', body: 'ตั้งชื่อชุด เลือก 8–40 ภาพ ใส่ข้อความและท่าทางทีละภาพ บันทึกอัตโนมัติ' },
  { icon: Eye, title: 'ทีมงานพิจารณา', body: 'ทีมงานอ่านบรีฟ อาจขอข้อมูลเพิ่ม แล้วแจ้งผลในหน้าคำขอ' },
  { icon: PenLine, title: 'ผลิตและตรวจงาน', body: 'งาน Commission ตรวจและขอแก้ได้ทีละภาพก่อนอนุมัติทั้งชุด' },
  { icon: Store, title: 'วางขายสาธารณะ', body: 'ชุดที่เสร็จจะส่งให้ LINE พิจารณาและวางขายใน LINE Sticker Store' },
]

export default function StudioLandingPage() {
  const user = useCurrentUser()
  const [drafts, setDrafts] = useState<LocalDraft[]>([])
  usePageMeta('Nompong Studio', 'เสนอไอเดียชุดสติกเกอร์นมผงฟรี หรือสั่งทำชุดสติกเกอร์ผ่าน Fastwork พร้อมตรวจงานทีละภาพ')
  const packages = useQuery({ queryKey: qk.packages, queryFn: () => api.requests.getPackages() })

  useEffect(() => {
    track('studio_opened')
    localDrafts.listFor(user?.id ?? null).then((all) => setDrafts(all.filter((d) => !d.serverId).slice(0, 3)))
  }, [user?.id])

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-sunny-100 to-cream">
        <Page className="pb-10 sm:pb-14">
          <p className="font-display text-sm font-medium text-muted">Nompong Studio</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">สร้างชุดสติกเกอร์นมผงในแบบของคุณ</h1>
          <p className="mt-3 max-w-xl text-[17px] text-muted">เลือกเส้นทางที่ใช่ ทั้งสองแบบใช้บรีฟเดียวกัน กรอกง่ายบนมือถือ และไม่หายแม้รีเฟรชหน้า</p>
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
                        {d.data.channel === 'commission' ? 'Commission' : 'Community'} · {completedCount(d.data)}/{d.data.stickerCount} ภาพ · {formatRelative(d.updatedAt)}
                      </span>
                    </span>
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {(['community', 'commission'] as const).map((c) => {
            const info = CHANNEL_INFO[c]
            const Icon = c === 'community' ? Lightbulb : Briefcase
            return (
              <article key={c} className="flex flex-col rounded-3xl border border-line bg-surface p-6">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c === 'community' ? 'bg-mint-100' : 'bg-sunny-100'}`}>
                  <Icon size={24} aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-2xl">{info.title}</h2>
                <p className="mt-1 text-muted">{info.summary}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {info.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check size={18} className="mt-0.5 shrink-0 text-success" aria-hidden /> {p}
                    </li>
                  ))}
                </ul>
                <LinkButton
                  to={`/studio/new?type=${c}`}
                  variant={c === 'community' ? 'secondary' : 'primary'}
                  size="lg"
                  block
                  className="mt-6"
                  iconRight={<ArrowRight size={18} />}
                  onClick={() => track('request_type_selected', { channel: c })}
                >
                  {c === 'community' ? 'เสนอไอเดีย' : 'เริ่มบรีฟงานสั่งทำ'}
                </LinkButton>
              </article>
            )
          })}
        </div>

        <Alert tone="info" className="mt-6" title={PUBLIC_DISCLOSURE.title}>
          {PUBLIC_DISCLOSURE.body}
        </Alert>

        <section aria-labelledby="how" className="mt-12">
          <h2 id="how" className="font-display text-2xl">
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

        <section aria-labelledby="packages" className="mt-12">
          <h2 id="packages" className="font-display text-2xl">
            แพ็กเกจงานสั่งทำ
          </h2>
          <p className="mt-1 text-sm text-muted">ราคา รอบแก้ไข และระยะเวลากำหนดโดยทีมงาน และยืนยันบน Fastwork</p>
          <div className="mt-4 -mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[30rem] overflow-hidden rounded-3xl border border-line bg-surface text-sm">
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    จำนวน
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    ราคา
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    แก้ไขได้
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    ระยะเวลา
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(packages.data ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-display">{p.stickerCount} ภาพ</td>
                    <td className="px-4 py-3">{p.priceLabel}</td>
                    <td className="px-4 py-3">{p.revisionRounds} รอบ</td>
                    <td className="px-4 py-3">~{p.turnaroundDays} วัน</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <MessageSquareText size={16} className="mt-0.5 shrink-0" aria-hidden />
            เว็บไซต์นี้ไม่รับชำระเงิน การชำระเงิน การส่งมอบ และข้อพิพาทเป็นไปตามกติกาของ Fastwork
          </p>
        </section>
      </Page>
    </>
  )
}
