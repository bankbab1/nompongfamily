import { test } from '@playwright/test'
import { signIn } from './helpers'

// Debug-only screenshot capture. Run with SHOTS=1.
const OUT = process.env.SHOTS_DIR ?? 'test-results/shots'
test.skip(!process.env.SHOTS, 'screenshots only on demand')

for (const [name, vp] of [['m', { width: 375, height: 812 }], ['d', { width: 1366, height: 860 }]] as const) {
  test(`shots ${name}`, async ({ page }) => {
    await page.setViewportSize(vp)
    const shot = async (n: string, full = false) => {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${OUT}/${name}-${n}.png`, fullPage: full })
    }
    await page.goto('/'); await shot('home', true)
    await page.goto('/stickers'); await shot('stickers')
    await page.goto('/studio'); await shot('studio')
    await signIn(page, 'member', '/studio/new?type=commission')
    await page.getByLabel('ชื่อชุดสติกเกอร์').fill('นมผงวัยทำงาน')
    await shot('wizard2', true)
    await page.getByRole('button', { name: 'ถัดไป', exact: true }).click()
    await page.getByLabel('ข้อความบนสติกเกอร์').fill('ง่วงงงงง')
    await shot('wizard3', true)
    await page.goto('/my'); await shot('my')
    await signIn(page, 'customer', '/my/requests/NP-26-0101/proof'); await shot('proof')
    await page.getByRole('button', { name: /ภาพ 03 .* รอตรวจ/ }).click(); await shot('proof-detail')
    await page.goto('/my/requests/NP-26-0101'); await shot('detail', true)
    await signIn(page, 'admin', '/admin/requests'); await shot('admin-inbox')
    await page.goto('/admin/production/NP-26-0105'); await shot('admin-prod')
  })
}
