import type { CaptureRun } from '@/capture/CaptureRun.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { Screen } from '@/model/Screen.js'

/** Files one attempt's outcome: a snapshot, or the error that ended it. */
export const recordCapture = (
  run: CaptureRun,
  route: RouteConfig,
  screen: Screen,
  outcome: PageSnapshot | string,
): void => {
  if (typeof outcome === 'string')
    run.failed.push({ route, screen, error: outcome })
  else run.captured.push({ route, snapshot: outcome })
}
