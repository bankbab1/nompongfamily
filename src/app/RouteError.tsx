import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

/** Last-resort error screen (also catches failed lazy chunk loads after a deploy). */
export function RouteError() {
  const error = useRouteError()
  const chunk = error instanceof Error && /dynamically imported module|Loading chunk/i.test(error.message)
  const status = isRouteErrorResponse(error) ? error.status : undefined
  if (import.meta.env.DEV) console.error(error)
  return (
    <div className="app-shell flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center" role="alert">
        <p className="font-display text-5xl text-sunny-700">{status ?? 'อุ๊ย!'}</p>
        <h1 className="mt-3 font-display text-2xl text-ink">{chunk ? 'มีเวอร์ชันใหม่ของเว็บ' : 'มีบางอย่างผิดพลาด'}</h1>
        <p className="mt-2 text-muted">
          {chunk ? 'กรุณาโหลดหน้าใหม่เพื่อใช้งานต่อ ฉบับร่างของคุณบันทึกไว้ในเครื่องแล้ว' : 'ฉบับร่างที่คุณกำลังทำบันทึกไว้ในเครื่องนี้แล้ว ลองโหลดหน้าใหม่อีกครั้ง'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={() => location.reload()} className="h-11 rounded-xl bg-brown px-5 font-medium text-cream">
            โหลดใหม่
          </button>
          <Link to="/" className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface px-5 font-medium">
            หน้าแรก
          </Link>
        </div>
      </div>
    </div>
  )
}
