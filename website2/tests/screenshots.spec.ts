import { test, expect } from '@playwright/test'

const pages = [
  { name: 'homepage', path: '/', title: 'Home' },
  { name: 'playground', path: '/playground', title: 'AI Playground' },
  { name: 'aius-dashboard', path: '/aius', title: 'AIUS Staking' },
  { name: 'lp-staking', path: '/lp-staking', title: 'LP Staking' },
  { name: 'models', path: '/models', title: 'Models' },
  { name: 'team', path: '/team', title: 'Team' },
  { name: 'media', path: '/media', title: 'Media' },
  { name: 'upgrade', path: '/upgrade', title: 'Upgrade' },
]

test.describe('Visual Screenshots', () => {
  for (const page of pages) {
    test(`${page.name} - full page screenshot`, async ({ page: p }) => {
      await p.goto(page.path)

      // Wait for page to be fully loaded
      await p.waitForLoadState('networkidle')

      // Take full page screenshot
      await p.screenshot({
        path: `screenshots/${page.name}-full.png`,
        fullPage: true,
      })

      // Take viewport screenshot
      await p.screenshot({
        path: `screenshots/${page.name}-viewport.png`,
        fullPage: false,
      })
    })
  }

  test('aius - gauge tab screenshot', async ({ page }) => {
    await page.goto('/aius')
    await page.waitForLoadState('networkidle')

    // Click on Gauge tab
    const gaugeTab = page.locator('text=Gauge')
    if (await gaugeTab.isVisible()) {
      await gaugeTab.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: 'screenshots/aius-gauge-full.png',
        fullPage: true,
      })
    }
  })

  test('responsive - mobile views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE
    })
    const page = await context.newPage()

    for (const p of pages.slice(0, 4)) { // Just test first few pages on mobile
      await page.goto(p.path)
      await page.waitForLoadState('networkidle')

      await page.screenshot({
        path: `screenshots/${p.name}-mobile.png`,
        fullPage: true,
      })
    }

    await context.close()
  })
})

test.describe('Interactive Elements', () => {
  test('navbar - dark mode toggle', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Light mode
    await page.screenshot({
      path: 'screenshots/navbar-light.png',
    })

    // Toggle to dark mode
    const themeToggle = page.locator('button[aria-label="Toggle theme"]')
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: 'screenshots/navbar-dark.png',
      })
    }
  })

  test('homepage - all sections', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Screenshot individual sections
    const sections = [
      'hero',
      'partners',
      'models',
      'democratic',
      'aius',
      'eacc',
      'community',
      'buy',
    ]

    for (const section of sections) {
      const element = page.locator(`section, div`).filter({ hasText: section }).first()
      if (await element.isVisible()) {
        await element.screenshot({
          path: `screenshots/homepage-${section}.png`,
        })
      }
    }
  })
})
