import { ChevronDown } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { useLocale, useTx } from '@/lib/i18n'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const FAQ = {
  th: [
    ['ขอชุดสติกเกอร์แบบส่วนตัวได้ไหม?', 'ไม่ได้ ทุกชุดของนมผงตั้งใจวางขายแบบสาธารณะใน LINE Sticker Store'],
    ['เสนอไอเดียแล้วจะได้ผลิตแน่นอนไหม?', 'ไม่แน่นอน ทีมงานพิจารณาทุกไอเดีย แต่ไม่รับประกันการผลิตหรือกำหนดวัน'],
    ['ถ้าเผลอรีเฟรชหน้า ข้อมูลจะหายไหม?', 'ไม่หาย ระบบบันทึกฉบับร่างในเครื่องอัตโนมัติ และซิงก์ขึ้นบัญชีเมื่อเข้าสู่ระบบและออนไลน์'],
    ['ส่งไปแล้วแก้ไขได้ไหม?', 'หลังส่งแล้วแก้เองไม่ได้ ยกเว้นทีมงานขอข้อมูลเพิ่ม เมื่ออนุมัติบรีฟแล้ว การเปลี่ยนแปลงจะทำผ่านรอบแก้ไขงาน'],
    ['ได้กี่ภาพต่อชุด?', '8, 16, 24, 32 หรือ 40 ภาพ'],
    ['ข้อความภาษาไทยที่พิมพ์ซ้ำตัว เช่น “ง่วงงงง” จะถูกแก้ไหม?', 'ไม่ ระบบเก็บข้อความตามที่คุณพิมพ์ทุกตัวอักษร รวมวรรณยุกต์และตัวอักษรซ้ำ'],
  ],
  en: [
    ['Can I get a private sticker set?', 'No. Every Nompong set is made for public sale on the LINE Sticker Store.'],
    ['If I share an idea, will it definitely be made?', 'Not necessarily. The team considers every idea but can’t promise it will be made or when.'],
    ['Will I lose my work if I refresh the page?', 'No. Drafts save on your device automatically and sync to your account when you’re signed in and online.'],
    ['Can I edit after sending?', 'Not by yourself, unless the team asks for more details. Once the brief is approved, changes go through revision rounds.'],
    ['How many stickers per set?', '8, 16, 24, 32 or 40.'],
    [
      'Will Thai words with repeated letters, like “ง่วงงงง”, be corrected?',
      'No. Your words are kept exactly as typed, including tone marks and repeated letters.',
    ],
  ],
}

export default function FaqPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('คำถามที่พบบ่อย', 'FAQ'))
  return (
    <Page narrow>
      <PageHeader title={tx('คำถามที่พบบ่อย', 'Frequently asked questions')} />
      <ul className="space-y-2">
        {FAQ[locale].map(([q, a]) => (
          <li key={q}>
            <details className="group rounded-2xl border border-line bg-surface px-4">
              <summary className="flex min-h-14 list-none items-center justify-between gap-3 font-medium">
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
