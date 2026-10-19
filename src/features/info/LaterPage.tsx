import { Hourglass } from 'lucide-react'
import { EmptyState } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'

/** Placeholder for routes scheduled in a later phase (P1–P3). */
export default function LaterPage({ title, phase }: { title: string; phase: string }) {
  return (
    <Page narrow>
      <EmptyState
        icon={<Hourglass size={24} />}
        title={`${title} — เร็วๆ นี้`}
        description={`ฟีเจอร์นี้อยู่ในแผนระยะ ${phase}`}
        actions={<LinkButton to="/my">กลับ My Nompong</LinkButton>}
      />
    </Page>
  )
}
