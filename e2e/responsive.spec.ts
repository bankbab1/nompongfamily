import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, signIn } from './helpers'

const PUBLIC = ['/', '/about', '/stickers', '/stickers/v1', '/studio', '/studio/new?type=commission', '/wallpapers', '/wallpapers/sunny-morning', '/ideas', '/faq', '/terms']
const CUSTOMER = ['/my', '/my/requests', '/my/requests/NP-26-0101', '/my/requests/NP-26-0101/proof']
const ADMIN = ['/admin', '/admin/requests', '/admin/requests/NP-26-0101', '/admin/production/NP-26-0101', '/admin/stickers', '/admin/settings']

for (const width of [320, 768, 1280]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } })

    test(`public pages fit without horizontal scroll (FE-01, FE-11)`, async ({ page }) => {
      for (const path of PUBLIC) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('main')).toBeVisible()
        await expectNoHorizontalOverflow(page)
      }
    })

    test(`customer pages fit`, async ({ page }) => {
      await signIn(page, 'customer')
      for (const path of CUSTOMER) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectNoHorizontalOverflow(page)
      }
    })

    test(`admin pages fit`, async ({ page }) => {
      await signIn(page, 'admin')
      for (const path of ADMIN) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectNoHorizontalOverflow(page)
      }
    })
  })
}

test.describe('navigation', () => {
  test('mobile bottom nav has the four spec destinations', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'เมนูด้านล่าง' })
    for (const name of ['หน้าแรก', 'สำรวจ', 'สตูดิโอ', 'My Nompong']) await expect(nav.getByRole('link', { name })).toBeVisible()
  })

  test('keyboard: skip link and visible focus (FE-13)', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'ข้ามไปยังเนื้อหา' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })
})
