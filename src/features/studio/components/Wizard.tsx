import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, LogIn, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Alert, AutosaveIndicator } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { errorMessage, isApiError, type ApiError } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { RequestStatus, StickerRequest, User } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import { localDrafts } from '@/lib/storage/drafts'
import { useOnline } from '@/lib/utils/useOnline'
import { TERMS_VERSION, validateBrief, type BriefIssue } from '@/lib/validation/brief'
import { useDraftEditor } from '../hooks/useDraftEditor'
import type { LocalDraft, WizardStep } from '../model/draft'
import { ChannelStep } from './ChannelStep'
import { ConflictDialog } from './ConflictDialog'
import { ReferencesStep } from './ReferencesStep'
import { ReviewStep } from './ReviewStep'
import { SetInfoStep } from './SetInfoStep'
import { SlotsStep } from './SlotsStep'
import { StepIndicator } from './StepIndicator'
import { SubmittedView } from './SubmittedView'

/**
 * The 5-step brief builder (spec §6.2). Steps are freely navigable; only step 2 blocks
 * "Next" on invalid fields, and Review gathers every remaining issue with jump links.
 */
export function Wizard({ initial, user, serverStatus }: { initial: LocalDraft; user: User | null; serverStatus?: RequestStatus }) {
  const t = useT()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnline()
  const { draft, update, setMeta, saveState, retry, flush, conflict, resolveConflict } = useDraftEditor(initial, user)
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({})
  const [terms, setTerms] = useState(false)
  const [termsTouched, setTermsTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<StickerRequest | null>(null)
  const [resolving, setResolving] = useState(false)
  const submitLock = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  const { data, step } = draft
  const activeSlot = Math.min(draft.activeSlot, data.stickerCount)
  // The request type step is gone (Community only), so step 1 is never shown.
  const channelLocked = true
  const issues: BriefIssue[] = useMemo(() => validateBrief(data, { termsAccepted: terms, checkTerms: termsTouched }), [data, terms, termsTouched])
  const blocking = issues.filter((i) => i.scope !== 'terms')

  const goStep = (n: WizardStep, slot?: number) => {
    setMeta({ step: n, ...(slot ? { activeSlot: slot } : {}) })
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: 'start' })
      topRef.current?.focus({ preventScroll: true })
    })
  }

  useEffect(() => {
    if (channelLocked && step === 1) setMeta({ step: 2 })
  }, [channelLocked, step, setMeta])

  function next() {
    if (step === 2) {
      const setIssues = issues.filter((i) => i.scope === 'set' && i.field !== 'items')
      if (setIssues.length) {
        setShowErrors((s) => ({ ...s, 2: true }))
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
        return
      }
    }
    if (step === 3) setShowErrors((s) => ({ ...s, 3: true }))
    goStep(Math.min(5, step + 1) as WizardStep)
  }

  async function submit() {
    if (submitLock.current) return
    setTermsTouched(true)
    setShowErrors({ 2: true, 3: true })
    if (blocking.length || !terms) {
      requestAnimationFrame(() => document.getElementById('review-issues')?.focus())
      return
    }
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    submitLock.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const synced = await flush()
      if (!synced?.serverId || synced.dirty) throw new Error('sync')
      const res = await api.requests.submitRequest(synced.serverId, { termsVersion: TERMS_VERSION })
      await localDrafts.remove(draft.clientDraftId)
      qc.invalidateQueries({ queryKey: qk.myRequests })
      qc.invalidateQueries({ queryKey: qk.request(res.id) })
      track('request_submitted', { channel: res.channel, count: res.stickerCount })
      setSubmitted(res)
      window.scrollTo({ top: 0 })
    } catch (e) {
      // The draft stays intact locally on every failure path (spec §6.6).
      if (e instanceof Error && e.message === 'sync') {
        setSubmitError(online ? 'บันทึกขึ้นเซิร์ฟเวอร์ไม่สำเร็จ ฉบับร่างยังอยู่ในเครื่อง ลองกดส่งอีกครั้ง' : 'ออฟไลน์อยู่ ฉบับร่างยังอยู่ในเครื่อง เชื่อมต่อแล้วกดส่งอีกครั้ง')
      } else if (isApiError(e, 'validation') && Array.isArray((e as ApiError).detail)) {
        setSubmitError('เซิร์ฟเวอร์พบข้อมูลที่ยังไม่ครบ กรุณาตรวจรายการด้านบน')
      } else {
        setSubmitError(`${errorMessage(e)} — ฉบับร่างยังอยู่ครบ ลองอีกครั้งได้`)
      }
      toast.error('ส่งคำขอไม่สำเร็จ')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (submitted) return <SubmittedView request={submitted} />

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:pt-6">
      <div className="mb-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-sm text-muted">
            เสนอไอเดียชุดสติกเกอร์
            {draft.serverId && <span className="ml-2 tabular-nums">· {draft.serverId}</span>}
          </p>
          <AutosaveIndicator state={saveState} onRetry={() => void retry()} />
        </div>
        <StepIndicator step={step} onStep={goStep} lockedChannel={channelLocked} />
        {serverStatus === 'clarification_requested' && (
          <Alert tone="warning" title="ทีมงานขอข้อมูลเพิ่ม">
            แก้ไขตามที่ทีมงานขอ (ดูข้อความในหน้ารายละเอียดคำขอ) แล้วกดส่งอีกครั้งที่ขั้นตอนสุดท้าย
          </Alert>
        )}
        {!user && (
          <Alert tone="info" icon={<LogIn size={18} />} title="กำลังทำแบบไม่เข้าสู่ระบบ">
            ฉบับร่างบันทึกไว้ในเครื่องนี้เท่านั้น เข้าสู่ระบบเพื่อซิงก์และส่งคำขอ — ฉบับร่างจะย้ายเข้าบัญชีให้อัตโนมัติ
          </Alert>
        )}
      </div>

      <div ref={topRef} tabIndex={-1} className="scroll-mt-24 pb-6 focus:outline-none">
        {step === 1 && (
          <ChannelStep
            channel={data.channel}
            locked={channelLocked}
            onChange={(c) => {
              track('request_type_selected', { channel: c })
              update((d) => ({ ...d, channel: c }))
            }}
          />
        )}
        {step === 2 && <SetInfoStep data={data} issues={issues} showErrors={!!showErrors[2]} onChange={update} />}
        {step === 3 && (
          <SlotsStep data={data} active={activeSlot} issues={issues} showErrors={!!showErrors[3]} onChange={update} onActive={(p) => setMeta({ activeSlot: p })} />
        )}
        {step === 4 && <ReferencesStep data={data} onChange={update} />}
        {step === 5 && (
          <ReviewStep
            data={data}
            issues={issues}
            termsAccepted={terms}
            onTerms={(v) => {
              setTerms(v)
              setTermsTouched(true)
            }}
            onJump={goStep}
            online={online}
          />
        )}
        {submitError && step === 5 && (
          <Alert tone="danger" className="mt-4" title="ส่งไม่สำเร็จ">
            {submitError}
          </Alert>
        )}
      </div>

      {/* Sticky action bar: safe-area aware; sits in normal flow on desktop. */}
      <div className="mobile-sticky-actions sticky bottom-0 z-20 -mx-4 border-t border-line bg-cream/95 px-4 pt-3 backdrop-blur sm:mx-0 sm:rounded-t-3xl sm:border-x">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<ChevronLeft size={18} />}
            disabled={step === 1 || (step === 2 && channelLocked)}
            onClick={() => goStep((step - 1) as WizardStep)}
            className="shrink-0"
          >
            <span className="max-[359px]:sr-only">{t('wizard.prev')}</span>
          </Button>
          <div className="min-w-0 flex-1" />
          {step < 5 ? (
            <Button variant="primary" iconRight={<ChevronRight size={18} />} onClick={next} className="min-w-32 flex-1 sm:flex-none">
              {t('wizard.next')}
            </Button>
          ) : !user ? (
            <Button variant="primary" icon={<LogIn size={18} />} onClick={() => void submit()} className="flex-1 sm:flex-none">
              เข้าสู่ระบบเพื่อส่ง
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              icon={<Send size={18} />}
              loading={submitting}
              disabled={submitting || !online}
              onClick={() => void submit()}
              className="flex-1 sm:flex-none"
            >
              {submitting ? t('wizard.submitting') : serverStatus === 'clarification_requested' ? 'ส่งข้อมูลเพิ่มเติม' : t('wizard.submit')}
            </Button>
          )}
        </div>
      </div>

      {conflict && (
        <ConflictDialog
          open
          local={conflict.local}
          server={conflict.server}
          busy={resolving}
          onResolve={async (keep) => {
            setResolving(true)
            await resolveConflict(keep)
            setResolving(false)
          }}
        />
      )}
    </div>
  )
}
