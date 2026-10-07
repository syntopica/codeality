import { captureScreens } from '@/capture/captureScreens.js'
import type { CheckResult } from '@/check/CheckResult.js'
import { findingsFrom } from '@/check/findingsFrom.js'
import { routesMatching } from '@/config/routesMatching.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { screenLabel } from '@/model/screenLabel.js'

export const runCheck = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
  routeGlob: string | null = null,
): Promise<CheckResult> => {
  const scoped = routeGlob === null ? config : routesMatching(config, routeGlob)
  const { captured, failed } = await captureScreens(
    root,
    scoped,
    log,
    routeGlob === null,
  )
  return {
    findings: findingsFrom(captured, failed, scoped),
    screens: captured.map(({ snapshot }) => ({
      route: snapshot.screen.route,
      screen: screenLabel(snapshot.screen),
      screenshot: snapshot.screenshot,
    })),
  }
}
