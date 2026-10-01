import type { Playwright } from '@/capture/Playwright.js'

// Playwright is a peer dependency: the project brings its own version and its
// own browsers. A missing install is an infrastructure failure, exit 3.
export const loadPlaywright = async (): Promise<Playwright> => {
  try {
    return await import('playwright')
  } catch {
    throw new Error(
      'playwright is not installed; add it with "pnpm add -D playwright" and run "playwright install chromium"',
    )
  }
}
