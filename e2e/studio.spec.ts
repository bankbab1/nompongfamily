import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

const CAPTIONS = ['สวัสดีค่าาา', 'ง่วงงงงง', 'ขอบคุณน้าาา', 'เลิกงานแล้ววว', 'กำลังไป๊', 'สู้ๆ นะ!', 'ฝันดีน้า', 'เย้ๆๆ']

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

test('community brief on mobile: bulk paste, refresh-safe draft, validation, guest → sign in → submit (FE-02..07, FE-12, FE-15)', async ({ page }) => {
  await page.goto('/studio/new?type=community')
  await expect(page).toHaveURL(/draft=cd_/)

  // Step 2 — set info. Next is blocked until the set name is filled.
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(page.getByText('กรุณาตั้งชื่อชุดสติกเกอร์')).toBeVisible()
  await page.getByLabel('ชื่อชุดสติกเกอร์').fill('นมผงทดสอบ E2E')
  for (const n of [16, 24, 32, 40, 8]) {
    await page.getByRole('radio', { name: String(n), exact: true }).check({ force: true })
  }
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()

  // Step 3 — bulk paste 8 captions (exact Thai).
  await page.getByRole('button', { name: 'วางข้อความหลายภาพ' }).click()
  await page.getByLabel('ข้อความ (บรรทัดละภาพ)').fill(CAPTIONS.join('\n'))
  await page.getByRole('button', { name: 'ใส่ข้อความ 8 ภาพ' }).click()
  await expect(page.getByLabel('ข้อความบนสติกเกอร์')).toHaveValue(CAPTIONS[0])

  // Poses for slots 1–7 only (slot 8 left incomplete on purpose).
  for (let i = 1; i <= 7; i++) {
    await page.getByLabel('ท่าทาง / อารมณ์').fill(`ท่าที่ ${i} ยิ้มกว้าง`)
    await page.getByRole('button', { name: 'ภาพถัดไป', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: /ภาพที่ 08/ })).toBeVisible()
  await expect(page.getByText('บันทึกในเครื่องนี้แล้ว')).toBeVisible()

  // Accidental refresh: everything comes back from IndexedDB (FE-04, FE-12).
  await page.reload()
  await expect(page.getByRole('heading', { name: /ภาพที่ 08/ })).toBeVisible()
  await expect(page.getByLabel('ข้อความบนสติกเกอร์')).toHaveValue('เย้ๆๆ')
  await page.getByRole('button', { name: 'ภาพก่อนหน้า', exact: true }).click()
  await expect(page.getByLabel('ท่าทาง / อารมณ์')).toHaveValue('ท่าที่ 7 ยิ้มกว้าง')

  // Go to review — incomplete slot 08 is identified and blocks submission (FE-05).
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click() // → 4
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click() // → 5
  await expect(page.getByText('ทุกชุดตั้งใจวางจำหน่ายแบบสาธารณะ')).toBeVisible() // FE-15
  await expect(page.getByText('เป็นการเสนอไอเดียฟรี ไม่ใช่การสั่งจ้าง')).toBeVisible() // FE-06
  await page.getByRole('button', { name: 'เข้าสู่ระบบเพื่อส่ง' }).click()
  await expect(page.getByText(/ยังส่งไม่ได้/)).toBeVisible()
  await page.getByRole('button', { name: 'ไปแก้ภาพ 08' }).click()
  await page.getByLabel('ท่าทาง / อารมณ์').fill('กระโดดดีใจ')
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await expect(page.getByText(/ยังส่งไม่ได้/)).toHaveCount(0)

  // Guest must sign in; the draft is adopted into the account.
  await page.getByLabel(/ฉันได้อ่านและยอมรับ/).check({ force: true })
  await page.getByRole('button', { name: 'เข้าสู่ระบบเพื่อส่ง' }).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('button', { name: /พลอย/ }).click()
  await expect(page).toHaveURL(/\/studio\/new/)
  await expect(page.getByText('บันทึกแล้ว', { exact: true })).toBeVisible()

  await page.getByLabel(/ฉันได้อ่านและยอมรับ/).check({ force: true })
  await page.getByRole('button', { name: 'ส่งคำขอ' }).click()
  await expect(page.getByRole('heading', { name: 'ส่งคำขอเรียบร้อย!' })).toBeVisible()
  const id = (await page.getByTestId('request-id').textContent())!.trim()
  expect(id).toMatch(/^NP-\d{2}-\d{4}$/)

  // My Requests + detail show it with exact Thai captions (FE-03, FE-07).
  await page.getByRole('link', { name: 'ดูรายละเอียดคำขอ' }).click()
  await expect(page.getByRole('heading', { name: 'นมผงทดสอบ E2E' })).toBeVisible()
  for (const c of CAPTIONS) await expect(page.getByText(c, { exact: true }).first()).toBeVisible()
  await page.goto('/my/requests')
  await expect(page.getByRole('link', { name: 'นมผงทดสอบ E2E' })).toBeVisible()
})

test('lowering the sticker count warns and keeps hidden slot data (spec §6.4)', async ({ page }) => {
  await signIn(page, 'member', '/studio/new?type=commission')
  await expect(page).toHaveURL(/draft=cd_/)
  await page.getByLabel('ชื่อชุดสติกเกอร์').fill('ชุดทดสอบจำนวน')
  await page.getByRole('radio', { name: '16', exact: true }).check({ force: true })
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await page.getByRole('button', { name: 'ดูทุกภาพ' }).click()
  await page.getByRole('button', { name: /สติกเกอร์ 12/ }).click()
  await page.getByLabel('ข้อความบนสติกเกอร์').fill('ช่องที่สิบสอง')
  await page.getByRole('button', { name: 'ก่อนหน้า', exact: true }).click() // wizard prev → step 2
  await page.getByRole('radio', { name: '8', exact: true }).click({ force: true })
  await expect(page.getByRole('dialog', { name: 'ลดเหลือ 8 ภาพ?' })).toBeVisible()
  await page.getByRole('button', { name: 'ลดเหลือ 8 ภาพ' }).click()
  await page.getByRole('radio', { name: '16', exact: true }).check({ force: true })
  await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
  await page.getByRole('button', { name: 'ดูทุกภาพ' }).click()
  await page.getByRole('button', { name: /สติกเกอร์ 12/ }).click()
  await expect(page.getByLabel('ข้อความบนสติกเกอร์')).toHaveValue('ช่องที่สิบสอง')
})

test('offline: edits stay on the device and sync on reconnect (FE-04)', async ({ page, context }) => {
  await signIn(page, 'member', '/studio/new?type=community')
  await page.getByLabel('ชื่อชุดสติกเกอร์').fill('ออนไลน์ก่อน')
  await expect(page.getByText('บันทึกแล้ว', { exact: true })).toBeVisible()
  await context.setOffline(true)
  await page.getByLabel('ชื่อชุดสติกเกอร์').fill('แก้ตอนออฟไลน์')
  await expect(page.getByText('ออฟไลน์ — บันทึกไว้ในเครื่องนี้')).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText('บันทึกแล้ว', { exact: true })).toBeVisible()
  await page.goto('/my/requests')
  await expect(page.getByRole('link', { name: 'แก้ตอนออฟไลน์' })).toBeVisible()
})
