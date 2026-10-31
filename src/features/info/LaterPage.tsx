import { Hourglass } from 'lucide-react'
import { EmptyState } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { type Bilingual, pick, useLocale, useTx } from '@/lib/i18n'

/** Placeholder for routes scheduled in a later phase (P1–P3). */
export default function LaterPage({ title, phase }: { title: Bilingual; phase: string }) {
  const locale = useLocale()
  const tx = useTx()
  return (
    <Page narrow>
      <EmptyState
        icon={<Hourglass size={24} />}
        title={`${pick(title, locale)} — ${tx('เร็วๆ นี้', 'coming soon')}`}
        description={tx(`ฟีเจอร์นี้อยู่ในแผนระยะ ${phase}`, `Planned for phase ${phase}`)}
        actions={<LinkButton to="/my">{tx('กลับ My Nompong', 'Back to My Nompong')}</LinkButton>}
      />
    </Page>
  )
}
