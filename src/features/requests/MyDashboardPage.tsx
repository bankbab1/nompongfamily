import { ChevronRight, CreditCard, FileText, LogOut, Package, Palette, Shield, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { SignOutDialog } from '@/components/layout/SignOutDialog'
import { useCurrentUser } from '@/features/auth/useAuth'
import { awaitingCustomer } from '@/lib/domain/status'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { RequestCard } from './components'
import { useLocalOnlyDrafts, useMyRequests } from './useMyRequests'
import { useTx } from '@/lib/i18n'

export default function MyDashboardPage() {
  const user = useCurrentUser()!
  const q = useMyRequests()
  const local = useLocalOnlyDrafts(user.id)
  const [signOut, setSignOut] = useState(false)
  const tx = useTx()
  usePageMeta('My Nompong', undefined, { noindex: true })

  const todo = (q.data ?? []).filter((r) => awaitingCustomer(r.status))
  const recent = (q.data ?? []).filter((r) => !awaitingCustomer(r.status)).slice(0, 3)

  const links = [
    { to: '/my/requests', icon: FileText, label: tx('คำขอทั้งหมด', 'All requests') },
    { to: '/my/profile', icon: UserRound, label: tx('โปรไฟล์และการตั้งค่า', 'Profile and settings') },
    { to: '/my/collection', icon: CreditCard, label: tx('อัลบั้มการ์ดสะสม', 'Card album'), soon: true },
    { to: '/my/orders', icon: Package, label: tx('คำสั่งซื้อสินค้า', 'Shop orders'), soon: true },
    ...(user.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Studio Admin' }] : []),
  ]

  return (
    <Page>
      <p className="text-muted">{tx('สวัสดี', 'Hello')}</p>
      <h1 className="font-display text-3xl">{user.displayName}</h1>

      <div className="mt-6">
        <Link to="/suggest" className="flex min-h-24 flex-col justify-between rounded-3xl bg-sunny-100 p-4 hover:brightness-[0.98]">
          <Palette size={22} aria-hidden />
          <span className="font-display text-lg leading-tight">{tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')}</span>
        </Link>
      </div>

      {local.length > 0 && (
        <Alert
          tone="warning"
          className="mt-6"
          title={tx(`มีฉบับร่างในเครื่องนี้ ${local.length} ชุดที่ยังไม่ได้ซิงก์`, `${local.length} draft(s) on this device aren’t synced yet`)}
        >
          <Link to="/my/requests" className="underline">
            {tx('เปิดเพื่อซิงก์หรือทำต่อ', 'Open to sync or continue')}
          </Link>
        </Alert>
      )}

      {q.isPending ? (
        <div className="mt-8">
          <PageSkeleton rows={2} />
        </div>
      ) : (
        <>
          {todo.length > 0 && (
            <section aria-labelledby="todo" className="mt-8">
              <h2 id="todo" className="mb-3 font-display text-xl">
                {tx('รอคุณดำเนินการ', 'Waiting for you')} ({todo.length})
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {todo.map((r) => (
                  <li key={r.id}>
                    <RequestCard request={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {recent.length > 0 && (
            <section aria-labelledby="recent" className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="recent" className="font-display text-xl">
                  {tx('คำขอล่าสุด', 'Recent requests')}
                </h2>
                <Link to="/my/requests" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium">
                  {tx('ดูทั้งหมด', 'See all')} <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((r) => (
                  <li key={r.id}>
                    <RequestCard request={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <nav aria-label={tx('เมนูบัญชี', 'Account menu')} className="mt-10">
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="flex min-h-14 items-center gap-3 px-4 hover:bg-surface-muted">
                <l.icon size={20} className="text-muted" aria-hidden />
                <span className="flex-1">{l.label}</span>
                {'soon' in l && l.soon && <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">{tx('เร็วๆ นี้', 'Soon')}</span>}
                <ChevronRight size={18} className="text-muted" aria-hidden />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSignOut(true)}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-danger hover:bg-surface-muted"
            >
              <LogOut size={20} aria-hidden />
              <span className="flex-1">{tx('ออกจากระบบ', 'Sign out')}</span>
            </button>
          </li>
        </ul>
      </nav>
      <SignOutDialog open={signOut} onOpenChange={setSignOut} />
    </Page>
  )
}
