import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorState, Skeleton } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { wallpaperArt } from '@/lib/api/mock/art'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function WallpapersPage() {
  usePageMeta('วอลเปเปอร์', 'วอลเปเปอร์นมผงฟรี สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์')
  const q = useQuery({ queryKey: qk.wallpapers, queryFn: () => api.catalog.listWallpapers() })
  return (
    <Page>
      <PageHeader title="วอลเปเปอร์" description="ดาวน์โหลดฟรี เลือกขนาดให้ตรงกับอุปกรณ์ ไม่ต้องสมัครสมาชิก" />
      {q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {q.isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-[9/16]" />
                </li>
              ))
            : q.data.map((w) => (
                <li key={w.id}>
                  <Link to={`/wallpapers/${w.slug}`} className="group block">
                    <img
                      src={wallpaperArt({ palette: w.palette, width: 540, height: 1200, title: w.titleEn })}
                      alt=""
                      loading="lazy"
                      className="aspect-[9/16] w-full rounded-3xl border border-line object-cover transition-transform group-hover:-translate-y-0.5"
                    />
                    <p className="mt-2 font-display text-base">{w.titleTh}</p>
                    <p className="text-sm text-muted">
                      {w.theme} · {w.variants.length} ขนาด
                    </p>
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </Page>
  )
}
