import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FlaskConical, Shield, Sparkles, UserRound } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page } from '@/components/layout/AppShell'
import { Avatar } from '@/components/layout/AccountMenu'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import type { User } from '@/lib/api/types'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { useSession, useSignIn } from './useAuth'
import { type Bilingual, pick, useLocale, useTx } from '@/lib/i18n'

const ROLE_INFO: Record<User['role'], { label: Bilingual; icon: typeof UserRound; body: Bilingual }> = {
  member: {
    label: { th: 'สมาชิก', en: 'Member' },
    icon: Sparkles,
    body: { th: 'เสนอไอเดีย Community และติดตามคำขอ', en: 'Shares Community ideas and tracks requests' },
  },
  customer: { label: { th: 'สมาชิก', en: 'Member' }, icon: UserRound, body: { th: 'เสนอไอเดียและติดตามคำขอ', en: 'Shares ideas and tracks requests' } },
  admin: {
    label: { th: 'ผู้ดูแลสตูดิโอ', en: 'Studio admin' },
    icon: Shield,
    body: { th: 'กล่องคำขอ งานผลิต อัปโหลด proof', en: 'Inbox, production, proof uploads' },
  },
}

/** Only accept same-origin relative paths as post-login targets (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/my'
}

/**
 * Mock sign-in: choose a demo persona. The real adapter will redirect to the chosen
 * identity provider (open decision §18.4: mandatory sign-in vs secure invitation links).
 * No passwords are ever entered or stored by this page.
 */
export default function LoginPage() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const { data: user } = useSession()
  const signIn = useSignIn()
  const personas = useQuery({ queryKey: ['personas'], queryFn: () => api.auth.listPersonas() })
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('เข้าสู่ระบบ', 'Sign in'), undefined, { noindex: true })

  if (user && !signIn.isPending && !signIn.isSuccess) return <Navigate to={next} replace />

  return (
    <Page narrow className="max-w-lg">
      <h1 className="t-page font-display">{tx('เข้าสู่ระบบ', 'Sign in')}</h1>
      <p className="mt-2 text-muted">
        {tx('เข้าสู่ระบบเพื่อส่งคำขอ ซิงก์ฉบับร่างข้ามอุปกรณ์ และติดตามสถานะงาน', 'Sign in to send requests, sync drafts across devices and track progress.')}
      </p>
      {next.startsWith('/studio') && (
        <Alert tone="info" className="mt-4">
          {tx(
            'ฉบับร่างที่คุณทำไว้ในเครื่องนี้จะย้ายเข้าบัญชีอัตโนมัติหลังเข้าสู่ระบบ',
            'Drafts on this device move into your account automatically after you sign in.',
          )}
        </Alert>
      )}

      <div className="mt-6 rounded-3xl border border-sunny-200 bg-sunny-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical size={16} aria-hidden /> {tx('โหมดทดสอบ: เลือกบัญชีตัวอย่าง', 'Test mode: choose a sample account')}
        </p>
        <ul className="mt-3 space-y-2">
          {(personas.data ?? []).map((p) => {
            const info = ROLE_INFO[p.role]
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={signIn.isPending}
                  onClick={() =>
                    signIn.mutate(p.id, {
                      onSuccess: (u) => {
                        toast.success(`${tx('ยินดีต้อนรับ', 'Welcome')} ${u.displayName}`)
                        navigate(u.role === 'admin' && next === '/my' ? '/admin' : next, { replace: true })
                      },
                      onError: (e) => toast.error(errorMessage(e)),
                    })
                  }
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left hover:border-brown disabled:opacity-60"
                >
                  <Avatar name={p.displayName} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{p.displayName}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <info.icon size={12} aria-hidden /> {pick(info.label, locale)} — {pick(info.body, locale)}
                    </span>
                  </span>
                  <ArrowRight size={18} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="mt-4 text-xs text-muted">
        {tx(
          'เวอร์ชันจริงจะเข้าสู่ระบบผ่านผู้ให้บริการยืนยันตัวตน (เช่น LINE Login) โดยเว็บนี้ไม่เก็บรหัสผ่าน',
          'The real version signs in through an identity provider (such as LINE Login); this site never stores passwords.',
        )}
      </p>
    </Page>
  )
}
