export type ApiErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'invalid_state'

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

export const isApiError = (e: unknown, code?: ApiErrorCode): e is ApiError =>
  e instanceof ApiError && (code === undefined || e.code === code)

/** User-facing message for any thrown value (Thai-first). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'network':
        return 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
      case 'unauthorized':
        return 'กรุณาเข้าสู่ระบบก่อน'
      case 'forbidden':
        return 'คุณไม่มีสิทธิ์ทำรายการนี้'
      case 'not_found':
        return 'ไม่พบข้อมูลที่ต้องการ'
      case 'conflict':
        return 'ข้อมูลถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่'
      default:
        return e.message
    }
  }
  return 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
}
