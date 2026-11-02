import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorState, Skeleton } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { wallpaperAsset } from './collection'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { useLocale, useTx } from '@/lib/i18n'

export default function WallpapersPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(
    tx('วอลเปเปอร์', 'Wallpapers'),
    tx('วอลเปเปอร์นมผงฟรี สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์', 'Free Nompong wallpapers for phone, tablet and computer'),
  )
  const q = useQuery({ queryKey: qk.wallpapers, queryFn: () => api.catalog.listWallpapers() })
  return (
    <Page>
      <PageHeader
        title={tx('วอลเปเปอร์', 'Wallpapers')}
        description={tx('ดาวน์โหลดฟรี เลือกขนาดให้ตรงกับอุปกรณ์ ไม่ต้องสมัครสมาชิก', 'Free downloads. Pick the size for your device; no sign-up needed.')}
      />
      {q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="space-y-10">
          {q.isPending ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[9/19.5]" />)}
          </div> : Array.from(new Set(q.data.map(w => w.theme))).map(theme => {
            const items = q.data.filter(w => w.theme === theme)
            return <section key={theme} aria-label={locale === 'en' ? items[0].themeEn || theme : theme}>
              <h2 className="t-section mb-4 font-display">{locale === 'en' ? items[0].themeEn || theme : theme}</h2>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {items.map(w => <li key={w.id}>
                  <Link to={`/wallpapers/${w.slug}`} className="group block">
                    <div className="overflow-hidden rounded-3xl bg-surface-muted shadow-sm">
                      <img src={wallpaperAsset(w.previewPath!)} alt="" loading="lazy"
                        width={w.variants[0].width} height={w.variants[0].height}
                        className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none" />
                    </div>
                    <p className="mt-2 font-display text-base">{locale === 'en' ? w.titleEn : w.titleTh}</p>
                    <p className="text-sm text-muted">{w.variants.length} {tx('ขนาด', 'sizes')}</p>
                  </Link>
                </li>)}
              </ul>
            </section>
          })}
        </div>
      )}
    </Page>
  )
}
