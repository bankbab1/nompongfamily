import { expect, type Page } from '@playwright/test'

export const PERSONA = { member: 'พลอย', customer: 'เมย์', admin: 'แอดมินสตูดิโอ' } as const

/** Fresh mock backend + no local drafts. Each Playwright context starts with empty storage anyway. */
export async function fresh(page: Page, path = '/') {
  await page.goto(path)
}

export async function signIn(page: Page, who: keyof typeof PERSONA, next?: string) {
  // Switching persona: drop any existing mock session first (a signed-in user is redirected away from /login).
  if (page.url().startsWith('http')) await page.evaluate(() => localStorage.removeItem('nompong-mock-session'))
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  await page.getByRole('button', { name: new RegExp(PERSONA[who]) }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** No element may extend the document horizontally (FE-01). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    const offenders: string[] = []
    if (doc.scrollWidth > doc.clientWidth + 1) {
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const r = el.getBoundingClientRect()
        if (r.right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed') {
          // Ignore descendants of intentionally horizontally scrollable containers.
          let p: HTMLElement | null = el.parentElement
          let scrollable = false
          while (p) {
            const ox = getComputedStyle(p).overflowX
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') {
              scrollable = true
              break
            }
            p = p.parentElement
          }
          if (!scrollable) offenders.push(`${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 60)}`)
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders: offenders.slice(0, 5) }
  })
  expect(overflow.scrollWidth, `horizontal overflow: ${overflow.offenders.join(' | ')}`).toBeLessThanOrEqual(overflow.clientWidth + 1)
}
