import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Select, TextField } from '@/components/ui/Field'
import { useCurrentUser } from '@/features/auth/useAuth'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import { setLocale, useTx } from '@/lib/i18n'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function ProfilePage() {
  const user = useCurrentUser()!
  const qc = useQueryClient()
  const [name, setName] = useState(user.displayName)
  const [locale, setLoc] = useState(user.locale)
  const [error, setError] = useState<string>()
  const tx = useTx()
  usePageMeta(tx('โปรไฟล์', 'Profile'), undefined, { noindex: true })

  const save = useMutation({
    mutationFn: () => api.auth.updateProfile({ displayName: name, locale }),
    onSuccess: (u) => {
      qc.setQueryData(qk.session, u)
      setLocale(u.locale)
      toast.success(u.locale === 'en' ? 'Profile saved' : 'บันทึกโปรไฟล์แล้ว')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <Page narrow>
      <PageHeader
        title={tx('โปรไฟล์', 'Profile')}
        description={tx('ชื่อที่แสดงจะเห็นได้โดยทีมงานในคำขอและคอมเมนต์ของคุณ', 'The team sees your display name on your requests and comments.')}
      />
      <Card>
        <form
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return setError(tx('กรุณาใส่ชื่อที่แสดง', 'Please enter a display name'))
            setError(undefined)
            save.mutate()
          }}
        >
          <TextField
            label={tx('ชื่อที่แสดง', 'Display name')}
            required
            value={name}
            maxChars={60}
            onChange={(e) => setName(e.target.value)}
            error={error}
            autoComplete="nickname"
          />
          <TextField label={tx('อีเมล', 'Email')} value={user.email} disabled hint={tx('จัดการผ่านผู้ให้บริการบัญชี', 'Managed by your sign-in provider')} />
          <Select label={tx('ภาษาของหน้าเว็บ', 'Website language')} value={locale} onChange={(e) => setLoc(e.target.value as 'th' | 'en')}>
            <option value="th">ภาษาไทย</option>
            <option value="en">English</option>
          </Select>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={save.isPending}>
              {tx('บันทึก', 'Save')}
            </Button>
          </div>
        </form>
      </Card>
      <Card className="mt-6 text-sm text-muted">
        <h2 className="mb-2 font-display text-lg text-ink">{tx('ข้อมูลส่วนบุคคล', 'Personal data')}</h2>
        {tx(
          'เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ อ่านรายละเอียดการเก็บรักษาและสิทธิ์ตาม PDPA ได้ที่',
          'We keep only what the service needs. Read about retention and your PDPA rights in the',
        )}{' '}
        <a href="/privacy" className="underline">
          {tx('นโยบายความเป็นส่วนตัว', 'Privacy policy')}
        </a>
      </Card>
    </Page>
  )
}
