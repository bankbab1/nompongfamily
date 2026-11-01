import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  ExternalLink,
  Factory,
  Image,
  Inbox,
  LayoutDashboard,
  Menu,
  Newspaper,
  Settings,
  Sticker,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { PageSkeleton } from '@/components/feedback/States'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { Wordmark } from '@/components/layout/Wordmark'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  later?: string
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'งานหลัก',
    items: [
      { to: '/admin', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
      { to: '/admin/requests', label: 'กล่องคำขอ', icon: Inbox },
      { to: '/admin/production', label: 'งานผลิต', icon: Factory },
    ],
  },
  {
    group: 'คอนเทนต์',
    items: [
      { to: '/admin/stickers', label: 'แคตตาล็อกสติกเกอร์', icon: Sticker },
      { to: '/admin/content', label: 'หน้าเว็บ & ประกาศ', icon: Newspaper, later: 'P1' },
      { to: '/admin/wallpapers', label: 'วอลเปเปอร์', icon: Image, later: 'P1' },
      { to: '/admin/products', label: 'สินค้า', icon: Boxes, later: 'P2' },
      { to: '/admin/cards', label: 'การ์ดสะสม', icon: CreditCard, later: 'P2' },
    ],
  },
  { group: 'ระบบ', items: [{ to: '/admin/settings', label: 'ตั้งค่า', icon: Settings }] },
]

const COLLAPSE_KEY = 'nompong-admin-sidebar'

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="เมนูผู้ดูแล" className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
      {NAV.map((g) => (
        <div key={g.group}>
          {!collapsed && <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{g.group}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const link = (
                <NavLink
                  to={it.to}
                  end={it.end}
                  onClick={onNavigate}
                  aria-label={collapsed ? it.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium',
                      isActive ? 'bg-sunny text-brown' : 'text-ink/85 hover:bg-surface-muted',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <it.icon size={19} aria-hidden />
                  {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                  {!collapsed && it.later && <span className="rounded-md bg-surface-muted px-1.5 text-[10px] text-muted">{it.later}</span>}
                </NavLink>
              )
              return <li key={it.to}>{collapsed ? <Tooltip content={it.label}>{link}</Tooltip> : link}</li>
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Admin workspace: persistent collapsible sidebar on desktop, drawer below lg (spec §4). */
export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setDrawer(false), [pathname])
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <div className="app-shell flex flex-col bg-background">
      <a href="#main" className="sr-only z-50 rounded-xl bg-brown px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        ข้ามไปยังเนื้อหา
      </a>
      <div className="flex min-h-0 flex-1">
        <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface lg:flex', collapsed ? 'w-[72px]' : 'w-64')}>
          <div className={cn('flex h-16 items-center border-b border-line px-3', collapsed ? 'justify-center' : 'justify-between')}>
            <Wordmark compact={collapsed} />
          </div>
          <SidebarNav collapsed={collapsed} />
          <div className="border-t border-line p-2">
            <Link
              to="/"
              className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-surface-muted', collapsed && 'justify-center px-0')}
            >
              <ExternalLink size={17} aria-hidden />
              {!collapsed ? 'ดูหน้าเว็บสาธารณะ' : <span className="sr-only">ดูหน้าเว็บสาธารณะ</span>}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-surface-muted',
                collapsed && 'justify-center px-0',
              )}
              aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            >
              {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
              {!collapsed && 'ย่อเมนู'}
            </button>
          </div>
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนูผู้ดูแล">
            <button type="button" className="absolute inset-0 bg-brown-800/40" aria-label="ปิดเมนู" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-2xl">
              <div className="flex h-16 items-center border-b border-line px-3">
                <Wordmark />
              </div>
              <SidebarNav collapsed={false} onNavigate={() => setDrawer(false)} />
              <Link to="/" className="m-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-surface-muted">
                <ExternalLink size={17} aria-hidden /> ดูหน้าเว็บสาธารณะ
              </Link>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-cream/90 px-4 backdrop-blur">
            <button
              type="button"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-surface-muted lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={22} />
            </button>
            <span className="font-display text-lg">Studio Admin</span>
            <div className="ml-auto">
              <AccountMenu />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 focus:outline-none lg:px-8">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <ScrollRestoration />
    </div>
  )
}
