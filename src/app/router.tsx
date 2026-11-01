import { lazy } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router'
import { AppShell, type RouteHandle } from '@/components/layout/AppShell'
import { RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { RouteError } from './RouteError'

/* Route-level code splitting (spec §3): every page is its own chunk. */
const HomePage = lazy(() => import('@/features/home/HomePage'))
const ExplorePage = lazy(() => import('@/features/home/ExplorePage'))
const AboutPage = lazy(() => import('@/features/about/AboutPage'))
const CatalogPage = lazy(() => import('@/features/stickers/CatalogPage'))
const SetDetailPage = lazy(() => import('@/features/stickers/SetDetailPage'))
const LineSetPage = lazy(() => import('@/features/stickers/LineSetPage'))

/** /stickers/37672065 is a real LINE set (its store id); anything else is an older sample-set slug. */
function StickerSetRoute() {
  const { slug = '' } = useParams()
  return /^\d+$/.test(slug) ? <LineSetPage id={slug} /> : <SetDetailPage />
}
const WallpapersPage = lazy(() => import('@/features/wallpapers/WallpapersPage'))
const WallpaperDetailPage = lazy(() => import('@/features/wallpapers/WallpaperDetailPage'))
const ShopPage = lazy(() => import('@/features/shop/ShopPage'))
const CardsPage = lazy(() => import('@/features/cards/CardsPage'))
const TermsPage = lazy(() => import('@/features/info/TermsPage'))
const PrivacyPage = lazy(() => import('@/features/info/PrivacyPage'))
const FaqPage = lazy(() => import('@/features/info/FaqPage'))
const SuggestPage = lazy(() => import('@/features/suggestions/SuggestPage'))
const NotFoundPage = lazy(() => import('@/features/info/NotFoundPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const MyDashboardPage = lazy(() => import('@/features/requests/MyDashboardPage'))
const ProfilePage = lazy(() => import('@/features/requests/ProfilePage'))
const LaterPage = lazy(() => import('@/features/info/LaterPage'))

const AdminLayout = lazy(() => import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminOverviewPage = lazy(() => import('@/features/admin/OverviewPage'))
const AdminIdeasPage = lazy(() => import('@/features/admin/IdeasPage'))
const AdminIdeaDetailPage = lazy(() => import('@/features/admin/IdeaDetailPage'))
const AdminSettingsPage = lazy(() => import('@/features/admin/SettingsPage'))

const h = (handle: RouteHandle) => handle

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'explore', element: <ExplorePage /> },
        { path: 'about', element: <AboutPage />, handle: h({ title: { th: 'รู้จักนมผง', en: 'Meet Nompong' }, back: '/explore' }) },
        { path: 'stickers', element: <CatalogPage />, handle: h({ title: { th: 'สติกเกอร์', en: 'Stickers' }, back: '/explore' }) },
        { path: 'stickers/:slug', element: <StickerSetRoute />, handle: h({ title: { th: 'ชุดสติกเกอร์', en: 'Sticker set' }, back: '/stickers' }) },
        // One way to send an idea: the sticker builder. The old Studio pages point there.
        { path: 'studio', element: <Navigate to="/suggest" replace /> },
        { path: 'studio/new', element: <Navigate to="/suggest" replace /> },
        { path: 'wallpapers', element: <WallpapersPage />, handle: h({ title: { th: 'วอลเปเปอร์', en: 'Wallpapers' }, back: '/explore' }) },
        { path: 'wallpapers/:slug', element: <WallpaperDetailPage />, handle: h({ title: { th: 'วอลเปเปอร์', en: 'Wallpapers' }, back: '/wallpapers' }) },
        { path: 'shop', element: <ShopPage />, handle: h({ title: { th: 'ร้านค้า', en: 'Shop' }, back: '/explore' }) },
        { path: 'cards', element: <CardsPage />, handle: h({ title: { th: 'การ์ดสะสม', en: 'Collectible cards' }, back: '/explore' }) },
        { path: 'suggest', element: <SuggestPage />, handle: h({ title: { th: 'ออกแบบสติกเกอร์', en: 'Design stickers' }, back: '/explore' }) },
        { path: 'ideas', element: <Navigate to="/suggest" replace /> }, // the old ideas board now lives in the sticker builder
        { path: 'terms', element: <TermsPage />, handle: h({ title: { th: 'ข้อกำหนด', en: 'Terms' }, back: '/' }) },
        { path: 'privacy', element: <PrivacyPage />, handle: h({ title: { th: 'ความเป็นส่วนตัว', en: 'Privacy' }, back: '/' }) },
        { path: 'faq', element: <FaqPage />, handle: h({ title: { th: 'คำถามที่พบบ่อย', en: 'FAQ' }, back: '/' }) },
        { path: 'login', element: <LoginPage /> },
        {
          path: 'my',
          element: <RequireAuth />,
          children: [
            { index: true, element: <MyDashboardPage /> },
            // Requests from the old Studio form are retired; ideas and their status live on My Nompong.
            { path: 'requests/*', element: <Navigate to="/my" replace /> },
            { path: 'profile', element: <ProfilePage />, handle: h({ title: { th: 'โปรไฟล์', en: 'Profile' }, back: '/my' }) },
            {
              path: 'collection',
              element: <LaterPage title={{ th: 'อัลบั้มการ์ดสะสม', en: 'Card album' }} phase="P3" />,
              handle: h({ title: { th: 'อัลบั้มการ์ด', en: 'Card album' }, back: '/my' }),
            },
            {
              path: 'orders',
              element: <LaterPage title={{ th: 'คำสั่งซื้อสินค้า', en: 'Shop orders' }} phase="P3" />,
              handle: h({ title: { th: 'คำสั่งซื้อ', en: 'Orders' }, back: '/my' }),
            },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    {
      path: 'admin',
      element: <RequireAdmin />,
      errorElement: <RouteError />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: <AdminOverviewPage /> },
            { path: 'ideas', element: <AdminIdeasPage /> },
            { path: 'ideas/:id', element: <AdminIdeaDetailPage /> },
            { path: 'settings', element: <AdminSettingsPage /> },
            // Old admin pages (requests, production, sticker catalogue, placeholders) are gone:
            // stickers live in LINE Creators Market, and fan ideas are handled under "ideas".
            { path: 'requests/*', element: <Navigate to="/admin/ideas" replace /> },
            { path: '*', element: <Navigate to="/admin" replace /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
