import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import type { FailedCapture } from '@/capture/FailedCapture.js'

/** Everything a run captured, and the screens it could not. */
export type CaptureRun = { captured: CapturedScreen[]; failed: FailedCapture[] }
