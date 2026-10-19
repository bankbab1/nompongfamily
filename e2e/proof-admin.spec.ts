import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test('customer reviews proofs: revise needs a comment, final approval only when all approved (FE-08, FE-09)', async ({ page }) => {
  await signIn(page, 'customer')
  await page.goto('/my/requests/NP-26-0101/proof')
  const finalBtn = page.getByRole('button', { name: 'อนุมัติทั้งชุด' })
  await expect(finalBtn).toBeDisabled()

  // Image 03: try to request a revision without a comment.
  await page.getByRole('button', { name: /ภาพ 03 .* รอตรวจ/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('เวอร์ชันล่าสุด:')).toBeVisible()
  await dialog.getByRole('button', { name: 'เทียบเวอร์ชันก่อนหน้า' }).click()
  await expect(dialog.getByText(/ก่อนหน้า \(v1\)/)).toBeVisible()
  await dialog.getByRole('button', { name: 'ขอแก้ไข' }).click()
  await dialog.getByRole('button', { name: 'ส่งคำขอแก้ไข' }).click()
  await expect(dialog.getByText('กรุณาระบุสิ่งที่ต้องการให้แก้ (จำเป็น)')).toBeVisible()
  await dialog.getByRole('button', { name: 'ยกเลิก' }).click()
  await dialog.getByRole('button', { name: 'อนุมัติ v2' }).click()
  await expect(page.getByText('อนุมัติภาพแล้ว')).toBeVisible()

  // Next pending image (07) via the viewer's navigation, then approve.
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /ภาพ 07 .* รอตรวจ/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'อนุมัติ v2' }).click()
  await page.keyboard.press('Escape')

  await expect(finalBtn).toBeEnabled()
  await finalBtn.click()
  await expect(page.getByRole('dialog', { name: 'อนุมัติทั้งชุด?' })).toContainText('03:v2')
  await page.getByRole('dialog').getByRole('button', { name: 'อนุมัติทั้งชุด' }).click()
  await expect(page.getByText('อนุมัติทั้งชุดแล้ว — อ่านอย่างเดียว')).toBeVisible()
  await expect(page.getByRole('button', { name: 'อนุมัติทั้งชุด' })).toHaveCount(0)
})

test('customer revision → admin uploads a new version and releases the next round (FE-08, FE-10)', async ({ page }) => {
  await signIn(page, 'customer')
  await page.goto('/my/requests/NP-26-0101/proof')
  await page.getByRole('button', { name: /ภาพ 03 .* รอตรวจ/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'ขอแก้ไข' }).click()
  await page.getByLabel(/ต้องการให้แก้อะไร/).fill('ขอให้ตาปรือกว่านี้อีกนิด')
  await page.getByRole('button', { name: 'ส่งคำขอแก้ไข' }).click()
  await expect(page.getByText('ส่งคำขอแก้ไขแล้ว').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /ภาพ 07 .* รอตรวจ/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'อนุมัติ v2' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('ทีมงานกำลังแก้ 1 ภาพ')).toBeVisible()

  await signIn(page, 'admin', '/admin/production/NP-26-0101')
  await expect(page.getByText('ขอให้ตาปรือกว่านี้อีกนิด')).toBeVisible()
  const release = page.getByRole('button', { name: 'ปล่อยงานให้ลูกค้าตรวจ' })
  await expect(release).toBeDisabled()
  await page.getByRole('button', { name: 'สร้างภาพตัวอย่าง (mock)' }).first().click()
  await expect(release).toBeEnabled()
  await release.click()
  await page.getByRole('dialog').getByRole('button', { name: 'ปล่อยงาน' }).click()
  await expect(page.getByText(/ปล่อยงานรอบที่ 3/)).toBeVisible()

  await signIn(page, 'customer', '/my/requests/NP-26-0101/proof')
  await expect(page.getByText(/รอบที่ 3/)).toBeVisible()
  await expect(page.getByRole('button', { name: /ภาพ 03 .* รอตรวจ/ })).toContainText('v3')
})

test('admin moves a community idea through review with required messages (FE-10, FE-14)', async ({ page }) => {
  await signIn(page, 'admin', '/admin/requests')
  await expect(page.getByRole('heading', { name: 'กล่องคำขอ' })).toBeVisible()
  await page.getByRole('tab', { name: 'ใหม่' }).click()
  await page.getByRole('link', { name: 'NP-26-0106' }).click()
  await page.getByRole('button', { name: '→ กำลังพิจารณา' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }).click()
  await expect(page.getByText('เปลี่ยนสถานะเป็น “กำลังพิจารณา” แล้ว')).toBeVisible()
  await page.getByRole('button', { name: '→ ขอข้อมูลเพิ่ม' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('กรุณาระบุข้อความถึงลูกค้า')
  await page.getByRole('dialog').getByLabel(/ข้อความถึงลูกค้า/).fill('ช่วยอธิบายท่าภาพ 3 เพิ่มค่ะ')
  await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }).click()
  await expect(page.getByText('ช่วยอธิบายท่าภาพ 3 เพิ่มค่ะ').first()).toBeVisible()

  // Internal note is admin-only.
  await page.getByLabel('เพิ่มโน้ตภายใน').fill('โน้ตลับของทีม')
  await page.getByRole('button', { name: 'บันทึกโน้ต' }).click()
  await expect(page.getByText('โน้ตลับของทีม')).toBeVisible()

  // Catalog keeps V / M / CR / Foundation separate.
  await page.goto('/stickers?series=CR')
  await expect(page.getByText('CR1', { exact: true })).toBeVisible()
  await expect(page.getByText('V1', { exact: true })).toHaveCount(0)
})

test('non-admins get an access-denied screen for admin routes', async ({ page }) => {
  await signIn(page, 'member')
  await page.goto('/admin')
  await expect(page.getByText('ไม่มีสิทธิ์เข้าถึงหน้านี้')).toBeVisible()
})
