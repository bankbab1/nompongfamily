import { EmptyState } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function NotFoundPage() {
  usePageMeta('ไม่พบหน้า', undefined, { noindex: true })
  return (
    <Page narrow>
      <EmptyState
        title="ไม่พบหน้าที่ต้องการ"
        description="ลิงก์อาจผิดหรือหน้านี้ถูกย้ายแล้ว"
        actions={
          <LinkButton to="/" variant="primary">
            กลับหน้าแรก
          </LinkButton>
        }
      />
    </Page>
  )
}
