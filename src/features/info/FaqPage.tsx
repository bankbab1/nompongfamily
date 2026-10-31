import { ChevronDown } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const FAQ = [
  ['ขอชุดสติกเกอร์แบบส่วนตัวได้ไหม?', 'ไม่ได้ ทุกชุดของนมผงตั้งใจวางขายแบบสาธารณะใน LINE Sticker Store'],
  ['เสนอไอเดียแล้วจะได้ผลิตแน่นอนไหม?', 'ไม่แน่นอน ทีมงานพิจารณาทุกไอเดีย แต่ไม่รับประกันการผลิตหรือกำหนดวัน'],
  ['ถ้าเผลอรีเฟรชหน้า ข้อมูลจะหายไหม?', 'ไม่หาย ระบบบันทึกฉบับร่างในเครื่องอัตโนมัติ และซิงก์ขึ้นบัญชีเมื่อเข้าสู่ระบบและออนไลน์'],
  ['ส่งไปแล้วแก้ไขได้ไหม?', 'หลังส่งแล้วแก้เองไม่ได้ ยกเว้นทีมงานขอข้อมูลเพิ่ม เมื่ออนุมัติบรีฟแล้ว การเปลี่ยนแปลงจะทำผ่านรอบแก้ไขงาน'],
  ['ได้กี่ภาพต่อชุด?', '8, 16, 24, 32 หรือ 40 ภาพ'],
  ['ข้อความภาษาไทยที่พิมพ์ซ้ำตัว เช่น “ง่วงงงง” จะถูกแก้ไหม?', 'ไม่ ระบบเก็บข้อความตามที่คุณพิมพ์ทุกตัวอักษร รวมวรรณยุกต์และตัวอักษรซ้ำ'],
]

export default function FaqPage() {
  usePageMeta('คำถามที่พบบ่อย')
  return (
    <Page narrow>
      <PageHeader title="คำถามที่พบบ่อย" />
      <ul className="space-y-2">
        {FAQ.map(([q, a]) => (
          <li key={q}>
            <details className="group rounded-2xl border border-line bg-surface px-4">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {q}
                <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-muted">{a}</p>
            </details>
          </li>
        ))}
      </ul>
    </Page>
  )
}
