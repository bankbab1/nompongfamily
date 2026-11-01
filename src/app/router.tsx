import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell, type RouteHandle } from '@/components/layout/AppShell'
import { RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { RouteError } from './RouteError'

/* Route-level code splitting (spec §3): every page is its own chunk. */
const HomePage = lazy(() => import('@/features/home/HomePage'))
const ExplorePage = lazy(() => import('@/features/home/ExplorePage'))
const AboutPage = lazy(() => import('@/features/about/AboutPage'))
const CatalogPage = lazy(() => import('@/features/stickers/CatalogPage'))
const SetDetailPage = lazy(() => import('@/features/stickers/SetDetailPage'))
const EditRequestPage = lazy(() => import('@/features/studio/pages/EditRequestPage'))
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
const MyRequestsPage = lazy(() => import('@/features/requests/MyRequestsPage'))
const RequestDetailPage = lazy(() => import('@/features/requests/RequestDetailPage'))
const ProfilePage = lazy(() => import('@/features/requests/ProfilePage'))
const ProofReviewPage = lazy(() => import('@/features/proofs/ProofReviewPage'))
const LaterPage = lazy(() => import('@/features/info/LaterPage'))

const AdminLayout = lazy(() => import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminOverviewPage = lazy(() => import('@/features/admin/OverviewPage'))
const AdminInboxPage = lazy(() => import('@/features/admin/InboxPage'))
const AdminRequestPage = lazy(() => import('@/features/admin/AdminRequestPage'))
const ProductionListPage = lazy(() => import('@/features/admin/ProductionListPage'))
const ProductionJobPage = lazy(() => import('@/features/admin/ProductionJobPage'))
const AdminStickersPage = lazy(() => import('@/features/admin/StickersAdminPage'))
const AdminSettingsPage = lazy(() => import('@/features/admin/SettingsPage'))
const AdminLaterPage = lazy(() => import('@/features/admin/AdminLaterPage'))

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
        { path: 'stickers/:slug', element: <SetDetailPage />, handle: h({ title: { th: 'ชุดสติกเกอร์', en: 'Sticker set' }, back: '/stickers' }) },
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
            { path: 'requests', element: <MyRequestsPage />, handle: h({ title: { th: 'คำขอของฉัน', en: 'My requests' }, back: '/my' }) },
            {
              path: 'requests/:id',
              element: <RequestDetailPage />,
              handle: h({ title: { th: 'รายละเอียดคำขอ', en: 'Request details' }, back: '/my/requests' }),
            },
            {
              path: 'requests/:id/edit',
              element: <EditRequestPage />,
              handle: h({ title: { th: 'แก้ไขคำขอ', en: 'Edit request' }, back: '/my/requests', hideBottomNav: true }),
            },
            { path: 'requests/:id/proof', element: <ProofReviewPage />, handle: h({ title: { th: 'ตรวจงาน', en: 'Review artwork' }, back: '/my/requests' }) },
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
            { path: 'requests', element: <AdminInboxPage /> },
            { path: 'requests/:id', element: <AdminRequestPage /> },
            { path: 'production', element: <ProductionListPage /> },
            { path: 'production/:id', element: <ProductionJobPage /> },
            { path: 'stickers', element: <AdminStickersPage /> },
            { path: 'settings', element: <AdminSettingsPage /> },
            { path: 'content', element: <AdminLaterPage title="หน้าเว็บ & ประกาศ" phase="P1" /> },
            { path: 'wallpapers', element: <AdminLaterPage title="วอลเปเปอร์" phase="P1" /> },
            { path: 'products', element: <AdminLaterPage title="สินค้า" phase="P2" /> },
            { path: 'cards', element: <AdminLaterPage title="การ์ดสะสม" phase="P2" /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
