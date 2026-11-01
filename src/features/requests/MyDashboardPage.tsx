import { ChevronRight, CreditCard, LogOut, Package, Palette, Shield, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { SignOutDialog } from '@/components/layout/SignOutDialog'
import { useCurrentUser } from '@/features/auth/useAuth'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { MyIdeas } from '@/features/suggestions/MyIdeas'
import { useTx } from '@/lib/i18n'

export default function MyDashboardPage() {
  const user = useCurrentUser()!
  const [signOut, setSignOut] = useState(false)
  const tx = useTx()
  usePageMeta('My Nompong', undefined, { noindex: true })

  const links = [
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

      <MyIdeas />

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
