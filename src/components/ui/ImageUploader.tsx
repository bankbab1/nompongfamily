import { ImagePlus } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import type { ReferenceAsset } from '@/lib/api/types'
import { formatBytes } from '@/lib/utils/format'
import { uid } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { useTx } from '@/lib/i18n'

export interface UploaderLimits {
  maxFiles: number
  maxBytes: number
  accept: readonly string[]
}

/**
 * Prepare an image for the mock adapter: downscale to ≤1600px JPEG so drafts fit in
 * browser storage. A real adapter uploads the original (resumable, retried) and the
 * server does malware/content validation (spec §6.3).
 */
async function prepare(file: File): Promise<{ url: string; size: number; mime: ReferenceAsset['mime'] }> {
  const MAX = 1600
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', 0.82)
    return { url, size: Math.round((url.length * 3) / 4), mime: 'image/jpeg' }
  } catch {
    // Fallback (e.g. no createImageBitmap): store as-is.
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(String(r.result))
      r.onerror = () => rej(r.error)
      r.readAsDataURL(file)
    })
    return { url, size: file.size, mime: file.type as ReferenceAsset['mime'] }
  }
}

export function ImageUploader({
  limits,
  existingCount,
  onAdd,
  label,
  hint,
  disabled,
  compact,
}: {
  limits: UploaderLimits
  existingCount: number
  onAdd(assets: ReferenceAsset[]): void
  label?: string
  hint?: string
  disabled?: boolean
  compact?: boolean
}) {
  const tx = useTx()
  const text = label ?? tx('เพิ่มภาพอ้างอิง', 'Add reference images')
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const remaining = limits.maxFiles - existingCount

  async function handle(files: FileList | null) {
    if (!files?.length) return
    const errs: string[] = []
    const accepted: File[] = []
    for (const f of Array.from(files)) {
      if (!limits.accept.includes(f.type)) errs.push(`${f.name}: ${tx('รองรับเฉพาะ JPG, PNG, WebP', 'only JPG, PNG or WebP')}`)
      else if (f.size > limits.maxBytes) errs.push(`${f.name}: ${tx('ใหญ่เกิน', 'larger than')} ${formatBytes(limits.maxBytes)}`)
      else if (accepted.length >= remaining)
        errs.push(`${f.name}: ${tx(`เกินจำนวนสูงสุด ${limits.maxFiles} ไฟล์`, `over the limit of ${limits.maxFiles} files`)}`)
      else accepted.push(f)
    }
    setBusy(true)
    const assets: ReferenceAsset[] = []
    for (const f of accepted) {
      try {
        const p = await prepare(f)
        assets.push({ id: uid('ref'), name: f.name, mime: p.mime, size: p.size, url: p.url })
      } catch {
        errs.push(`${f.name}: ${tx('อ่านไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง', 'couldn’t read the file, please try again')}`)
      }
    }
    setBusy(false)
    setErrors(errs)
    if (assets.length) onAdd(assets)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    if (!disabled) void handle(e.dataTransfer.files)
  }

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
          compact ? 'min-h-24 py-4' : 'min-h-36 py-6',
          drag ? 'border-brown bg-sunny-50' : 'border-line-strong bg-surface hover:bg-surface-muted',
          (disabled || remaining <= 0) && 'pointer-events-none opacity-50',
        )}
      >
        <ImagePlus size={compact ? 22 : 28} className="text-muted" aria-hidden />
        <span className="font-medium text-ink">{busy ? tx('กำลังเตรียมภาพ…', 'Preparing images…') : text}</span>
        <span className="text-xs text-muted">
          {hint ??
            `JPG, PNG, WebP · ${tx('ไม่เกิน', 'up to')} ${formatBytes(limits.maxBytes)} · ${tx('เหลือ', '')} ${Math.max(0, remaining)} ${tx('ไฟล์', 'files left')}`}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          accept={limits.accept.join(',')}
          multiple
          disabled={disabled || remaining <= 0 || busy}
          onChange={(e) => void handle(e.target.files)}
        />
      </label>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-danger" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
