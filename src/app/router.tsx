import { lazy } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppShell, type RouteHandle } from '@/components/layout/AppShell'
import { RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { FULL_APP } from './phase'
import { RouteError } from './RouteError'

/* Route-level code splitting (spec §3): every page is its own chunk. */
const PortalHomePage = lazy(() => import('@/features/portal/PortalHomePage'))
const NompongPage = lazy(() => import('@/features/nompong/NompongPage'))
const SuggestPage = lazy(() => import('@/features/suggestions/SuggestPage'))
const HomePage = lazy(() => import('@/features/home/HomePage'))
const ExplorePage = lazy(() => import('@/features/home/ExplorePage'))
const AboutPage = lazy(() => import('@/features/about/AboutPage'))
const CatalogPage = lazy(() => import('@/features/stickers/CatalogPage'))
const SetDetailPage = lazy(() => import('@/features/stickers/SetDetailPage'))
const StudioLandingPage = lazy(() => import('@/features/studio/pages/StudioLandingPage'))
const NewRequestPage = lazy(() => import('@/features/studio/pages/NewRequestPage'))
const EditRequestPage = lazy(() => import('@/features/studio/pages/EditRequestPage'))
const WallpapersPage = lazy(() => import('@/features/wallpapers/WallpapersPage'))
const WallpaperDetailPage = lazy(() => import('@/features/wallpapers/WallpaperDetailPage'))
const ShopPage = lazy(() => import('@/features/shop/ShopPage'))
const CardsPage = lazy(() => import('@/features/cards/CardsPage'))
const IdeasPage = lazy(() => import('@/features/ideas/IdeasPage'))
const TermsPage = lazy(() => import('@/features/info/TermsPage'))
const PrivacyPage = lazy(() => import('@/features/info/PrivacyPage'))
const FaqPage = lazy(() => import('@/features/info/FaqPage'))
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

/** Phase 1: only the Nompong introduction and the sticker suggestion wall. */
const portalRoutes: RouteObject[] = [
  { index: true, element: <PortalHomePage /> },
  { path: 'nompong', element: <NompongPage />, handle: h({ title: 'รู้จักนมผง', back: '/' }) },
  { path: 'suggest', element: <SuggestPage />, handle: h({ title: 'เสนอไอเดียสติกเกอร์', back: '/' }) },
]

/** Old links that point at hidden pages land on their phase-1 replacements. */
const phase1Redirects: RouteObject[] = [
  { path: 'about', element: <Navigate to="/nompong" replace /> },
  { path: 'ideas', element: <Navigate to="/suggest" replace /> },
]

/** Earlier Studio / catalog / account features, kept for later phases (VITE_FULL_APP=true). */
const fullRoutes: RouteObject[] = [
  { path: 'classic', element: <HomePage /> },
  { path: 'explore', element: <ExplorePage /> },
  { path: 'about', element: <AboutPage />, handle: h({ title: 'รู้จักนมผง', back: '/explore' }) },
  { path: 'stickers', element: <CatalogPage />, handle: h({ title: 'สติกเกอร์', back: '/explore' }) },
  { path: 'stickers/:slug', element: <SetDetailPage />, handle: h({ title: 'ชุดสติกเกอร์', back: '/stickers' }) },
  { path: 'studio', element: <StudioLandingPage /> },
  { path: 'studio/new', element: <NewRequestPage />, handle: h({ title: 'สร้างคำขอ', back: '/studio', hideBottomNav: true }) },
  { path: 'wallpapers', element: <WallpapersPage />, handle: h({ title: 'วอลเปเปอร์', back: '/explore' }) },
  { path: 'wallpapers/:slug', element: <WallpaperDetailPage />, handle: h({ title: 'วอลเปเปอร์', back: '/wallpapers' }) },
  { path: 'shop', element: <ShopPage />, handle: h({ title: 'ร้านค้า', back: '/explore' }) },
  { path: 'cards', element: <CardsPage />, handle: h({ title: 'การ์ดสะสม', back: '/explore' }) },
  { path: 'ideas', element: <IdeasPage />, handle: h({ title: 'บอร์ดไอเดีย', back: '/explore' }) },
  { path: 'terms', element: <TermsPage />, handle: h({ title: 'ข้อกำหนด', back: '/' }) },
  { path: 'privacy', element: <PrivacyPage />, handle: h({ title: 'ความเป็นส่วนตัว', back: '/' }) },
  { path: 'faq', element: <FaqPage />, handle: h({ title: 'คำถามที่พบบ่อย', back: '/' }) },
  { path: 'login', element: <LoginPage /> },
  {
    path: 'my',
    element: <RequireAuth />,
    children: [
      { index: true, element: <MyDashboardPage /> },
      { path: 'requests', element: <MyRequestsPage />, handle: h({ title: 'คำขอของฉัน', back: '/my' }) },
      { path: 'requests/:id', element: <RequestDetailPage />, handle: h({ title: 'รายละเอียดคำขอ', back: '/my/requests' }) },
      { path: 'requests/:id/edit', element: <EditRequestPage />, handle: h({ title: 'แก้ไขคำขอ', back: '/my/requests', hideBottomNav: true }) },
      { path: 'requests/:id/proof', element: <ProofReviewPage />, handle: h({ title: 'ตรวจงาน', back: '/my/requests' }) },
      { path: 'profile', element: <ProfilePage />, handle: h({ title: 'โปรไฟล์', back: '/my' }) },
      { path: 'collection', element: <LaterPage title="อัลบั้มการ์ดสะสม" phase="P3" />, handle: h({ title: 'อัลบั้มการ์ด', back: '/my' }) },
      { path: 'orders', element: <LaterPage title="คำสั่งซื้อสินค้า" phase="P3" />, handle: h({ title: 'คำสั่งซื้อ', back: '/my' }) },
    ],
  },
]

const adminRoutes: RouteObject[] = [
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
]

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [
        ...portalRoutes,
        ...(FULL_APP ? fullRoutes : phase1Redirects),
        { path: '*', element: <NotFoundPage /> },
      ],
    },
    ...(FULL_APP ? adminRoutes : []),
  ],
  { basename: '/nompongfamily' },
)
