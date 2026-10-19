import type { ReactNode } from 'react'
import { Page } from '@/components/layout/AppShell'

/** Long-form policy layout. Policy text is a draft pending legal review (spec §18.2). */
export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <Page narrow>
      <h1 className="font-display text-3xl">{title}</h1>
      {updated && <p className="mt-1 text-sm text-muted">ฉบับวันที่ {updated} · ร่างเพื่อการตรวจสอบทางกฎหมาย</p>}
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </Page>
  )
}
