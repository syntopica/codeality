import type { FailedCapture } from '@/capture/FailedCapture.js'
import type { Finding } from '@/model/Finding.js'
import { toFinding } from '@/report/toFinding.js'

/** A screen nothing was measured on, reported instead of ending the run. */
export const captureFailedFinding = ({
  screen,
  error,
}: FailedCapture): Finding =>
  toFinding(
    {
      rule: 'capture-failed',
      severity: 'error',
      message: `the page could not be loaded or measured, twice: ${error.split('\n')[0] ?? error}`,
      subject: 'page',
      identity: 'page',
    },
    screen,
  )
