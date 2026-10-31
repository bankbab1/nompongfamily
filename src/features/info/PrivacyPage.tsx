import { useLocale, useTx } from '@/lib/i18n'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { Prose } from './Prose'

export default function PrivacyPage() {
  const locale = useLocale()
  const tx = useTx()
  const title = tx('นโยบายความเป็นส่วนตัว', 'Privacy policy')
  usePageMeta(title)
  return (
    <Prose title={title} updated="2026-10-01">
      {locale === 'en' ? (
        <>
          <p>We collect only the personal data the service needs, and follow Thailand’s Personal Data Protection Act (PDPA).</p>
          <h2>What we collect</h2>
          <ul>
            <li>Account details: display name and email</li>
            <li>Request content: set name, words, poses and reference images</li>
            <li>We never store card or payment details</li>
          </ul>
          <h2>Drafts on your device</h2>
          <p>
            Drafts are saved in your browser (IndexedDB) so nothing is lost if you refresh or go offline. When you sign out, you can choose to remove drafts
            from the device.
          </p>
          <h2>How we use it</h2>
          <ul>
            <li>To make and publish sticker sets, and to contact you about your requests</li>
            <li>Usage statistics never record the words on stickers or your files</li>
            <li>The idea wall on the sticker designer shows only the sets you choose to share, with a nickname you can leave blank</li>
          </ul>
          <h2>Retention and your rights</h2>
          <p>Retention periods will be set by the back-end system rules. You can ask to see, correct or delete your data by contacting the team.</p>
        </>
      ) : (
        <>
          <p>เราเก็บข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการให้บริการ และปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
          <h2>ข้อมูลที่เก็บ</h2>
          <ul>
            <li>ข้อมูลบัญชี: ชื่อที่แสดง อีเมล</li>
            <li>เนื้อหาคำขอ: ชื่อชุด ข้อความ ท่าทาง ภาพอ้างอิง</li>
            <li>เราไม่เก็บข้อมูลบัตรหรือการชำระเงิน</li>
          </ul>
          <h2>ฉบับร่างในอุปกรณ์</h2>
          <p>ฉบับร่างถูกบันทึกในเบราว์เซอร์ของคุณ (IndexedDB) เพื่อไม่ให้ข้อมูลหายเมื่อรีเฟรชหรือออฟไลน์ เมื่อออกจากระบบ คุณเลือกลบฉบับร่างออกจากเครื่องได้</p>
          <h2>การใช้ข้อมูล</h2>
          <ul>
            <li>ใช้ผลิตและเผยแพร่ชุดสติกเกอร์ และติดต่อเรื่องคำขอ</li>
            <li>สถิติการใช้งานไม่บันทึกข้อความบนสติกเกอร์หรือไฟล์แนบ</li>
            <li>ผนังไอเดียในหน้าออกแบบสติกเกอร์แสดงเฉพาะชุดที่คุณเลือกส่ง พร้อมชื่อเล่นที่เว้นว่างได้</li>
          </ul>
          <h2>ระยะเวลาเก็บรักษาและสิทธิ์ของคุณ</h2>
          <p>ระยะเวลาเก็บรักษาจะกำหนดในข้อกำหนดฝั่งระบบหลังบ้าน คุณขอเข้าถึง แก้ไข หรือลบข้อมูลได้โดยติดต่อทีมงาน</p>
        </>
      )}
    </Prose>
  )
}
