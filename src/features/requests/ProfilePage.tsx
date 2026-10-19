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
import { setLocale } from '@/lib/i18n'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function ProfilePage() {
  const user = useCurrentUser()!
  const qc = useQueryClient()
  const [name, setName] = useState(user.displayName)
  const [locale, setLoc] = useState(user.locale)
  const [error, setError] = useState<string>()
  usePageMeta('โปรไฟล์', undefined, { noindex: true })

  const save = useMutation({
    mutationFn: () => api.auth.updateProfile({ displayName: name, locale }),
    onSuccess: (u) => {
      qc.setQueryData(qk.session, u)
      setLocale(u.locale)
      toast.success('บันทึกโปรไฟล์แล้ว')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <Page narrow>
      <PageHeader title="โปรไฟล์" description="ชื่อที่แสดงจะเห็นได้โดยทีมงานในคำขอและคอมเมนต์ของคุณ" />
      <Card>
        <form noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return setError('กรุณาใส่ชื่อที่แสดง')
            setError(undefined)
            save.mutate()
          }}
        >
          <TextField label="ชื่อที่แสดง" required value={name} maxChars={60} onChange={(e) => setName(e.target.value)} error={error} autoComplete="nickname" />
          <TextField label="อีเมล" value={user.email} disabled hint="จัดการผ่านผู้ให้บริการบัญชี" />
          <Select label="ภาษาของหน้าเว็บ" value={locale} onChange={(e) => setLoc(e.target.value as 'th' | 'en')} hint="English UI is partial during the MVP; Thai is used where a translation is missing.">
            <option value="th">ภาษาไทย</option>
            <option value="en">English (บางส่วน)</option>
          </Select>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={save.isPending}>
              บันทึก
            </Button>
          </div>
        </form>
      </Card>
      <Card className="mt-6 text-sm text-muted">
        <h2 className="mb-2 font-display text-lg text-ink">ข้อมูลส่วนบุคคล</h2>
        เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ อ่านรายละเอียดการเก็บรักษาและสิทธิ์ตาม PDPA ได้ที่{' '}
        <a href="/privacy" className="underline">
          นโยบายความเป็นส่วนตัว
        </a>
      </Card>
    </Page>
  )
}
