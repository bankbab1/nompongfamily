import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Checkbox } from '@/components/ui/Field'
import { useCurrentUser, useSignOut } from '@/features/auth/useAuth'
import { localDrafts } from '@/lib/storage/drafts'

/**
 * Shared-device policy (spec §6.5): drafts must not stay visible after sign-out unless the
 * user explicitly keeps them. Default is to clear; synced drafts remain on the account.
 */
export function SignOutDialog({ open, onOpenChange }: { open: boolean; onOpenChange(o: boolean): void }) {
  const user = useCurrentUser()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const [clear, setClear] = useState(true)
  const [unsynced, setUnsynced] = useState(0)

  useEffect(() => {
    if (open && user) localDrafts.unsyncedCount(user.id).then(setUnsynced)
  }, [open, user])

  if (!user) return null
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="ออกจากระบบ"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            loading={signOut.isPending}
            onClick={() =>
              signOut.mutate(
                { userId: user.id, clearLocalDrafts: clear },
                {
                  onSuccess: () => {
                    onOpenChange(false)
                    navigate('/')
                  },
                },
              )
            }
          >
            ออกจากระบบ
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Checkbox
          checked={clear}
          onChange={(e) => setClear(e.target.checked)}
          label="ลบฉบับร่างของฉันออกจากเครื่องนี้"
          description="แนะนำเมื่อใช้เครื่องร่วมกับผู้อื่น ฉบับร่างที่ซิงก์แล้วยังอยู่ในบัญชีของคุณ"
        />
        {clear && unsynced > 0 && (
          <Alert tone="warning" title={`มี ${unsynced} ฉบับร่างที่ยังไม่ได้ซิงก์`}>
            ถ้าลบตอนนี้ การแก้ไขที่ยังไม่ขึ้นเซิร์ฟเวอร์จะหายไป เชื่อมต่ออินเทอร์เน็ตแล้วเปิดฉบับร่างเพื่อซิงก์ก่อน หรือยกเลิกการติ๊กช่องนี้
          </Alert>
        )}
      </div>
    </ResponsiveModal>
  )
}
