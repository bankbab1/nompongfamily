import { ShieldAlert, Trash2 } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { formatBytes } from '@/lib/utils/format'
import { pad2 } from '@/lib/utils/id'
import { ACCEPTED_IMAGE_TYPES, LIMITS } from '@/lib/validation/brief'
import { useStudioContent } from '../content'
import { addReferences, removeReference, type DraftData } from '../model/draft'
import { useTx } from '@/lib/i18n'

export function ReferencesStep({ data, onChange }: { data: DraftData; onChange(fn: (d: DraftData) => DraftData): void }) {
  const tx = useTx()
  const { REFERENCE_GUIDANCE } = useStudioContent()
  const usedBy = (id: string) => data.items.slice(0, data.stickerCount).filter((it) => it.referenceAssetIds?.includes(id))

  async function remove(id: string, name: string) {
    const used = usedBy(id)
    const ok = await confirm({
      title: tx(`ลบ ${name}?`, `Delete ${name}?`),
      description: used.length
        ? tx(
            `ภาพนี้ถูกใช้ในภาพ ${used.map((u) => pad2(u.position)).join(', ')} จะถูกเอาออกจากช่องเหล่านั้นด้วย`,
            `It’s used by sticker ${used.map((u) => pad2(u.position)).join(', ')} and will be removed from those too.`,
          )
        : tx('ภาพนี้จะถูกเอาออกจากฉบับร่าง', 'The image will be removed from the draft.'),
      confirmLabel: tx('ลบภาพ', 'Delete image'),
      tone: 'danger',
    })
    if (ok) onChange((d) => removeReference(d, id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-ink">{tx('ภาพอ้างอิง (ไม่บังคับ)', 'Reference images (optional)')}</h2>
        <p className="mt-1 text-sm text-muted">
          {tx(
            'แนบภาพที่ช่วยอธิบายท่าทางหรืออารมณ์ แล้วเลือกใช้กับแต่ละภาพได้ในขั้นตอนรายละเอียดสติกเกอร์',
            'Add images that show a pose or mood, then pick them for each sticker in the sticker step.',
          )}
        </p>
      </div>

      <Alert tone="warning" icon={<ShieldAlert size={18} />} title={tx('ก่อนอัปโหลด', 'Before you upload')}>
        <ul className="list-disc space-y-0.5 pl-4">
          {REFERENCE_GUIDANCE.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </Alert>

      <ImageUploader
        limits={{ maxFiles: LIMITS.referenceFiles, maxBytes: LIMITS.referenceFileBytes, accept: ACCEPTED_IMAGE_TYPES }}
        existingCount={data.references.length}
        onAdd={(refs) => onChange((d) => addReferences(d, refs))}
      />

      {data.references.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.references.map((r) => {
            const used = usedBy(r.id)
            return (
              <li key={r.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
                <img src={r.url} alt={`${tx('ภาพอ้างอิง', 'Reference')} ${r.name}`} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted">{formatBytes(r.size)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {used.length
                      ? `${tx('ใช้ในภาพ', 'Used by')} ${used.map((u) => pad2(u.position)).join(', ')}`
                      : tx('ยังไม่ได้เลือกใช้กับภาพใด', 'Not used by any sticker yet')}
                  </p>
                  <input
                    className="mt-1.5 h-9 w-full rounded-lg border border-line px-2 text-sm focus:border-brown focus:outline-none"
                    placeholder={tx('โน้ตสั้นๆ (ไม่บังคับ)', 'Short note (optional)')}
                    aria-label={`${tx('โน้ตสำหรับ', 'Note for')} ${r.name}`}
                    value={r.note ?? ''}
                    maxLength={200}
                    onChange={(e) => onChange((d) => ({ ...d, references: d.references.map((x) => (x.id === r.id ? { ...x, note: e.target.value } : x)) }))}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  label={`${tx('ลบ', 'Delete')} ${r.name}`}
                  icon={<Trash2 size={18} />}
                  onClick={() => void remove(r.id, r.name)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
