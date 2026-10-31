import { TERMS_VERSION } from '@/lib/validation/brief'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { Prose } from './Prose'

export default function TermsPage() {
  usePageMeta('ข้อกำหนดการใช้งาน')
  return (
    <Prose title="ข้อกำหนดการใช้งาน" updated={TERMS_VERSION}>
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
    </Prose>
  )
}
