import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { useTx } from '@/lib/i18n'

/** Last-resort error screen (also catches failed lazy chunk loads after a deploy). */
export function RouteError() {
  const error = useRouteError()
  const tx = useTx()
  const chunk = error instanceof Error && /dynamically imported module|Loading chunk/i.test(error.message)
  const status = isRouteErrorResponse(error) ? error.status : undefined
  if (import.meta.env.DEV) console.error(error)
  return (
    <div className="app-shell flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center" role="alert">
        <p className="font-display text-5xl text-sunny-700">{status ?? tx('อุ๊ย!', 'Oops!')}</p>
        <h1 className="mt-3 font-display text-2xl text-ink">
          {chunk ? tx('มีเวอร์ชันใหม่ของเว็บ', 'A new version is available') : tx('มีบางอย่างผิดพลาด', 'Something went wrong')}
        </h1>
        <p className="mt-2 text-muted">
          {chunk
            ? tx('กรุณาโหลดหน้าใหม่เพื่อใช้งานต่อ ฉบับร่างของคุณบันทึกไว้ในเครื่องแล้ว', 'Please reload to continue. Your drafts are saved on this device.')
            : tx('ฉบับร่างที่คุณกำลังทำบันทึกไว้ในเครื่องนี้แล้ว ลองโหลดหน้าใหม่อีกครั้ง', 'Your drafts are saved on this device. Try reloading the page.')}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={() => location.reload()} className="h-11 rounded-xl bg-brown px-5 font-medium text-cream">
            {tx('โหลดใหม่', 'Reload')}
          </button>
          <Link to="/" className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface px-5 font-medium">
            {tx('หน้าแรก', 'Home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
