import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import type { Page } from 'playwright'

/**
 * An error no other route can recover from: a configuration the user has to
 * fix (exit 2), or a browser, context or page that is gone (exit 3). Anything
 * else - a navigation aborted by a hot reload, a page that timed out - belongs
 * to one screen.
 */
export const isFatalCaptureError = (page: Page, error: unknown): boolean =>
  error instanceof ConfigError ||
  page.isClosed() ||
  (error instanceof Error && /has been closed/u.test(error.message))
