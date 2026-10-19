import { useQuery } from '@tanstack/react-query'
import { Download, Laptop, Smartphone, Tablet } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { wallpaperArt } from '@/lib/api/mock/art'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { Wallpaper, WallpaperVariant } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Laptop }
const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)

/**
 * Mock export: renders the artwork at the exact variant resolution (never upscales a
 * preview). The real adapter downloads the pre-rendered master file from protected storage.
 */
async function renderVariant(w: Wallpaper, v: WallpaperVariant): Promise<Blob> {
  const img = new Image()
  img.src = wallpaperArt({ palette: w.palette, width: v.width, height: v.height, title: w.titleEn })
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = v.width
  canvas.height = v.height
  canvas.getContext('2d')!.drawImage(img, 0, 0, v.width, v.height)
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('export'))), v.format === 'PNG' ? 'image/png' : 'image/jpeg', 0.92))
}

export default function WallpaperDetailPage() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: qk.wallpaper(slug), queryFn: () => api.catalog.getWallpaper(slug) })
  const [variantId, setVariantId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  usePageMeta(q.data?.titleTh ?? 'วอลเปเปอร์')

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
  const w = q.data
  const v = w.variants.find((x) => x.id === variantId) ?? w.variants[0]

  async function download() {
    setBusy(true)
    try {
      const blob = await renderVariant(w, v)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nompong-${w.slug}-${v.width}x${v.height}.${v.format.toLowerCase()}`
      if (isIOS) a.target = '_blank'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
      track('wallpaper_downloaded', { wallpaper: w.slug, variant: `${v.width}x${v.height}` })
    } catch {
      toast.error('ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex items-start justify-center rounded-3xl bg-surface-muted p-4 sm:p-8">
          <img
            src={wallpaperArt({ palette: w.palette, width: v.width / 4, height: v.height / 4, title: w.titleEn })}
            alt={`ตัวอย่าง ${w.titleTh} ขนาด ${v.width}×${v.height}`}
            className={cn('max-h-[70vh] w-auto rounded-2xl border-4 border-brown shadow-lg', v.device === 'desktop' || v.width > v.height ? 'w-full' : 'max-w-[18rem]')}
          />
        </div>
        <div>
          <h1 className="font-display text-3xl">{w.titleTh}</h1>
          <p className="text-muted">
            {w.titleEn} · {w.theme}
          </p>
          <fieldset className="mt-6">
            <legend className="mb-2 font-medium">เลือกขนาด</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {w.variants.map((x) => {
                const Icon = DEVICE_ICON[x.device]
                const on = x.id === v.id
                return (
                  <label
                    key={x.id}
                    className={cn(
                      'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-surface px-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                      on ? 'border-brown bg-sunny-50' : 'border-line',
                    )}
                  >
                    <input type="radio" name="variant" className="sr-only" checked={on} onChange={() => setVariantId(x.id)} />
                    <Icon size={20} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{x.label}</span>
                      <span className="block text-xs text-muted">
                        {x.width}×{x.height} · {x.format} · ~{(x.sizeKb / 1024).toFixed(1)} MB
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <Button variant="primary" size="lg" block className="mt-5" icon={<Download size={18} />} loading={busy} onClick={() => void download()}>
            ดาวน์โหลด {v.width}×{v.height}
          </Button>
          {isIOS && (
            <Alert tone="info" className="mt-4" title="สำหรับ iPhone / iPad">
              ภาพจะเปิดในแท็บใหม่ กดค้างที่ภาพแล้วเลือก “บันทึกลงในรูปภาพ”
            </Alert>
          )}
          <p className="mt-5 text-sm text-muted">
            ใช้ได้ฟรีเพื่อการส่วนตัวเท่านั้น ห้ามนำไปขาย ดัดแปลงเพื่อการค้า หรืออ้างเป็นผลงานของตนเอง · ภาพออกแบบให้มีพื้นที่ปลอดภัยสำหรับนาฬิกาและไอคอน
          </p>
        </div>
      </div>
    </Page>
  )
}
