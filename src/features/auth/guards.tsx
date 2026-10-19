import { Lock } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { EmptyState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useSession } from './useAuth'

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
  return (
    <Page narrow>
      <EmptyState
        icon={<Lock size={24} />}
        title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
        description="หน้านี้สำหรับทีมงาน Nompong Studio เท่านั้น ถ้าคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อทีมงาน"
        actions={
          <LinkButton to="/" variant="primary">
            กลับหน้าแรก
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
