import { useLocale, useTx } from '@/lib/i18n'
import { TERMS_VERSION } from '@/lib/validation/brief'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { Prose } from './Prose'

export default function TermsPage() {
  const locale = useLocale()
  const tx = useTx()
  const title = tx('ข้อกำหนดการใช้งาน', 'Terms of use')
  usePageMeta(title)
  return (
    <Prose title={title} updated={TERMS_VERSION}>
      {locale === 'en' ? (
        <>
          <p>These terms apply to the nompong family website and the Nompong Studio service.</p>
          <h2>1. Public release</h2>
          <ul>
            <li>Every sticker set made through Nompong Studio is meant for public sale on the LINE Sticker Store</li>
            <li>There are no private or exclusive sticker sets</li>
            <li>Production, LINE approval and release dates can’t be guaranteed</li>
          </ul>
          <h2>2. Fan ideas (Community)</h2>
          <ul>
            <li>Sharing an idea is free and is not a paid order</li>
            <li>The team may or may not choose to make it, and may adjust details to fit the character</li>
          </ul>
          <h2>3. What you send</h2>
          <ul>
            <li>You confirm you have the right to use the words and reference images you send, and that they don’t infringe anyone’s copyright or rights</li>
            <li>The team may decline content that is inappropriate, belongs to someone else, or breaks LINE’s rules</li>
          </ul>
        </>
      ) : (
        <>
          <p>ข้อกำหนดนี้ใช้กับเว็บไซต์ nompong family และบริการ Nompong Studio</p>
          <h2>1. การเผยแพร่แบบสาธารณะ</h2>
          <ul>
            <li>ชุดสติกเกอร์ทุกชุดที่สร้างผ่าน Nompong Studio มีเป้าหมายวางจำหน่ายแบบสาธารณะใน LINE Sticker Store</li>
            <li>ไม่มีบริการชุดสติกเกอร์ส่วนตัวหรือเอ็กซ์คลูซีฟ</li>
            <li>การผลิต การอนุมัติจาก LINE และวันวางจำหน่าย ไม่สามารถรับประกันได้</li>
          </ul>
          <h2>2. ไอเดียจากแฟนๆ (Community)</h2>
          <ul>
            <li>การเสนอไอเดียไม่มีค่าใช้จ่าย และไม่ใช่การว่าจ้าง</li>
            <li>ทีมงานอาจเลือกหรือไม่เลือกผลิต และอาจปรับรายละเอียดให้เข้ากับคาแรกเตอร์</li>
          </ul>
          <h2>3. เนื้อหาที่ส่งมา</h2>
          <ul>
            <li>ผู้ส่งยืนยันว่ามีสิทธิ์ใช้ข้อความและภาพอ้างอิงที่ส่ง และไม่ละเมิดลิขสิทธิ์หรือสิทธิ์ของบุคคลอื่น</li>
            <li>ทีมงานอาจปฏิเสธเนื้อหาที่ไม่เหมาะสม มีลิขสิทธิ์ของผู้อื่น หรือขัดกับข้อกำหนดของ LINE</li>
          </ul>
        </>
      )}
    </Prose>
  )
}
