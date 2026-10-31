import { getLocale } from '@/lib/i18n'

export type ApiErrorCode = 'network' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'validation' | 'invalid_state'

/** Every service rejects with this, so UI code can branch on `code` regardless of adapter. */
export class ApiError<TDetail = unknown> extends Error {
  readonly code: ApiErrorCode
  readonly detail?: TDetail
  constructor(code: ApiErrorCode, message: string, detail?: TDetail) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.detail = detail
  }
}

export const isApiError = (e: unknown, code?: ApiErrorCode): e is ApiError => e instanceof ApiError && (code === undefined || e.code === code)

/** User-facing message for any thrown value, in the current language. */
export function errorMessage(e: unknown): string {
  const en = getLocale() === 'en'
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'network':
        return en ? 'Can’t connect. Check your internet and try again.' : 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
      case 'unauthorized':
        return en ? 'Please sign in first.' : 'กรุณาเข้าสู่ระบบก่อน'
      case 'forbidden':
        return en ? 'You don’t have permission to do this.' : 'คุณไม่มีสิทธิ์ทำรายการนี้'
      case 'not_found':
        return en ? 'We couldn’t find that.' : 'ไม่พบข้อมูลที่ต้องการ'
      case 'conflict':
        return en ? 'This was changed somewhere else. Please reload.' : 'ข้อมูลถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่'
      default:
        return e.message
    }
  }
  return en ? 'Something went wrong.' : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
}
