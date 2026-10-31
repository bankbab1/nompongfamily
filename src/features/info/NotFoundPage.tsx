import { EmptyState } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { useTx } from '@/lib/i18n'

export default function NotFoundPage() {
  const tx = useTx()
  usePageMeta(tx('ไม่พบหน้า', 'Page not found'), undefined, { noindex: true })
  return (
    <Page narrow>
      <EmptyState
        title={tx('ไม่พบหน้าที่ต้องการ', 'We can’t find that page')}
        description={tx('ลิงก์อาจผิดหรือหน้านี้ถูกย้ายแล้ว', 'The link may be wrong, or the page has moved.')}
        actions={
          <LinkButton to="/" variant="primary">
            {tx('กลับหน้าแรก', 'Back to home')}
          </LinkButton>
        }
      />
    </Page>
  )
}
