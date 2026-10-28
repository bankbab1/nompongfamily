import { EmptyState } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCopy } from '@/features/portal/copy'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function NotFoundPage() {
  const c = useCopy().notFound
  usePageMeta(c.title, undefined, { noindex: true })
  return (
    <Page narrow>
      <EmptyState
        title={c.title}
        description={c.body}
        actions={
          <LinkButton to="/" variant="primary">
            {c.home}
          </LinkButton>
        }
      />
    </Page>
  )
}
