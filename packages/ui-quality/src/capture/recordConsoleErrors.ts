import type { ConsoleMessage, Page } from 'playwright'

import type { ConsoleRecorder } from '@/capture/ConsoleRecorder.js'

/** Starts collecting console errors and uncaught exceptions from a page. */
export const recordConsoleErrors = (page: Page): ConsoleRecorder => {
  const errors: string[] = []
  const onConsole = (message: ConsoleMessage): void => {
    if (message.type() === 'error') errors.push(message.text())
  }
  const onPageError = (error: Error): void => {
    errors.push(error.message)
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  return {
    errors,
    stop: () => {
      page.off('console', onConsole)
      page.off('pageerror', onPageError)
    },
  }
}
