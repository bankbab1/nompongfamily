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

const ROLE_INFO: Record<User['role'], { label: string; icon: typeof UserRound; body: string }> = {
  member: { label: 'สมาชิก', icon: Sparkles, body: 'เสนอไอเดีย Community และติดตามคำขอ' },
  customer: { label: 'สมาชิก', icon: UserRound, body: 'เสนอไอเดียและติดตามคำขอ' },
  admin: { label: 'ผู้ดูแลสตูดิโอ', icon: Shield, body: 'กล่องคำขอ งานผลิต อัปโหลด proof' },
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
  usePageMeta('เข้าสู่ระบบ', undefined, { noindex: true })

  if (user && !signIn.isPending && !signIn.isSuccess) return <Navigate to={next} replace />

  return (
    <Page narrow className="max-w-lg">
      <h1 className="font-display text-3xl">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-muted">เข้าสู่ระบบเพื่อส่งคำขอ ซิงก์ฉบับร่างข้ามอุปกรณ์ และติดตามสถานะงาน</p>
      {next.startsWith('/studio') && (
        <Alert tone="info" className="mt-4">
          ฉบับร่างที่คุณทำไว้ในเครื่องนี้จะย้ายเข้าบัญชีอัตโนมัติหลังเข้าสู่ระบบ
        </Alert>
      )}

      <div className="mt-6 rounded-3xl border border-sunny-200 bg-sunny-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical size={16} aria-hidden /> โหมดทดสอบ: เลือกบัญชีตัวอย่าง
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
                        toast.success(`ยินดีต้อนรับ ${u.displayName}`)
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
                      <info.icon size={12} aria-hidden /> {info.label} — {info.body}
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
        เวอร์ชันจริงจะเข้าสู่ระบบผ่านผู้ให้บริการยืนยันตัวตน (เช่น LINE Login) โดยเว็บนี้ไม่เก็บรหัสผ่าน
      </p>
    </Page>
  )
}
