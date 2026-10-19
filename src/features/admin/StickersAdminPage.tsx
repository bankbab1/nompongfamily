import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Select, TextArea, TextField } from '@/components/ui/Field'
import { SERIES_LABEL, SetStatusBadge } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { SeriesKind, StickerSet } from '@/lib/api/types'
import { uid } from '@/lib/utils/id'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const SERIES: SeriesKind[] = ['V', 'M', 'CR', 'INTRO']

function blank(series: SeriesKind): StickerSet {
  return {
    id: uid('set'),
    slug: '',
    code: '',
    series,
    titleTh: '',
    titleEn: '',
    description: '',
    stickerCount: 24,
    status: 'draft',
    coverHue: '#F5D76E',
    tags: [],
    sampleCaptions: [],
  }
}

function SetDialog({ initial, onClose }: { initial: StickerSet; onClose(): void }) {
  const qc = useQueryClient()
  const [s, setS] = useState(initial)
  const [error, setError] = useState<string>()
  const save = useMutation({
    mutationFn: () => api.admin.saveSet({ ...s, code: s.code.trim().toUpperCase(), slug: s.code.trim().toLowerCase() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.sets })
      qc.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('บันทึกชุดสติกเกอร์แล้ว')
      onClose()
    },
    onError: (e) => setError(errorMessage(e)),
  })
  const patch = (p: Partial<StickerSet>) => setS((cur) => ({ ...cur, ...p }))
  return (
    <ResponsiveModal
      open
      onOpenChange={(o) => !o && onClose()}
      title={initial.code ? `แก้ไข ${initial.code}` : 'เพิ่มชุดสติกเกอร์'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="ซีรีส์" value={s.series} onChange={(e) => patch({ series: e.target.value as SeriesKind })} hint="V, M, CR และ INTRO ใช้เลขแยกกัน ห้ามปนกัน">
          {SERIES.map((x) => (
            <option key={x} value={x}>
              {SERIES_LABEL[x].th}
            </option>
          ))}
        </Select>
        <TextField label="รหัส" required value={s.code} onChange={(e) => patch({ code: e.target.value })} placeholder={s.series === 'INTRO' ? 'INTRO01' : `${s.series}12`} />
        <TextField label="ชื่อ (ไทย)" required value={s.titleTh} onChange={(e) => patch({ titleTh: e.target.value })} />
        <TextField label="ชื่อ (อังกฤษ)" value={s.titleEn} onChange={(e) => patch({ titleEn: e.target.value })} />
        <TextField label="จำนวนภาพ" type="number" min={8} max={40} value={s.stickerCount} onChange={(e) => patch({ stickerCount: Number(e.target.value) })} />
        <Select label="สถานะ" value={s.status} onChange={(e) => patch({ status: e.target.value as StickerSet['status'] })} hint="“ร่าง” จะไม่แสดงต่อสาธารณะ">
          <option value="draft">ร่าง (ไม่เผยแพร่)</option>
          <option value="coming_soon">เร็วๆ นี้</option>
          <option value="live">วางขายแล้ว</option>
        </Select>
        <TextField
          wrapperClassName="sm:col-span-2"
          label="ลิงก์ LINE Store"
          optional
          value={s.lineStoreUrl ?? ''}
          onChange={(e) => patch({ lineStoreUrl: e.target.value || undefined })}
          hint="ใส่เมื่อเผยแพร่จริงแล้วเท่านั้น"
          placeholder="https://store.line.me/stickershop/product/…"
        />
        <TextArea wrapperClassName="sm:col-span-2" label="คำอธิบาย" rows={3} value={s.description} onChange={(e) => patch({ description: e.target.value })} />
        {error && (
          <p className="text-sm text-danger sm:col-span-2" role="alert">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  )
}

export default function StickersAdminPage() {
  usePageMeta('แคตตาล็อกสติกเกอร์', undefined, { noindex: true })
  const q = useQuery({ queryKey: qk.admin.sets, queryFn: () => api.admin.listSets() })
  const [editing, setEditing] = useState<StickerSet | null>(null)

  if (q.isPending) return <PageSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="แคตตาล็อกสติกเกอร์"
        description="แยกซีรีส์ V, M, CR และ Foundation — เลขของแต่ละซีรีส์ไม่ปนกัน"
        actions={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing(blank('V'))}>
            เพิ่มชุด
          </Button>
        }
      />
      <div className="space-y-6">
        {SERIES.map((series) => {
          const sets = q.data.filter((s) => s.series === series).sort((a, b) => Number(a.code.replace(/\D/g, '')) - Number(b.code.replace(/\D/g, '')))
          return (
            <section key={series} aria-labelledby={`series-${series}`} className="rounded-3xl border border-line bg-surface">
              <h2 id={`series-${series}`} className="border-b border-line px-5 py-3 font-display text-lg">
                {SERIES_LABEL[series].th} <span className="text-sm text-muted">({sets.length})</span>
              </h2>
              <ul className="divide-y divide-line">
                {sets.map((s) => (
                  <li key={s.id} className="flex min-h-14 flex-wrap items-center gap-3 px-5 py-2.5">
                    <span className="w-16 shrink-0 font-display">{s.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{s.titleTh}</span>
                      <span className="block truncate text-xs text-muted">
                        {s.titleEn} · {s.stickerCount} ภาพ
                      </span>
                    </span>
                    <SetStatusBadge set={s} />
                    <Button size="sm" variant="ghost" iconOnly label={`แก้ไข ${s.code}`} icon={<Pencil size={16} />} onClick={() => setEditing(s)} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
      {editing && <SetDialog initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
