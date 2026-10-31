import { Lock } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { EmptyState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useSession } from './useAuth'
import { useTx } from '@/lib/i18n'

/**
 * Route guards are a UX convenience only. Hiding a screen is not authorization —
 * the backend must enforce every permission (spec §2 security rule).
 */
export function RequireAuth() {
  const { data: user, isPending } = useSession()
  const location = useLocation()
  if (isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

export function AccessDenied() {
  const tx = useTx()
  return (
    <Page narrow>
      <EmptyState
        icon={<Lock size={24} />}
        title={tx('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'You can’t open this page')}
        description={tx(
          'หน้านี้สำหรับทีมงาน Nompong Studio เท่านั้น ถ้าคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อทีมงาน',
          'This page is for the Nompong Studio team only. If you think this is a mistake, please contact the team.',
        )}
        actions={
          <LinkButton to="/" variant="primary">
            {tx('กลับหน้าแรก', 'Back to home')}
          </LinkButton>
        }
      />
    </Page>
  )
}

export function RequireAdmin() {
  const { data: user, isPending } = useSession()
  const location = useLocation()
  if (isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== 'admin') return <AccessDenied />
  return <Outlet />
}
