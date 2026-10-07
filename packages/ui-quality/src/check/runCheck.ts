import { captureScreens } from '@/capture/captureScreens.js'
import type { CheckResult } from '@/check/CheckResult.js'
import { findingsFrom } from '@/check/findingsFrom.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { screenLabel } from '@/model/screenLabel.js'

export const runCheck = async (
  root: string,
  config: UiQualityConfig,
  log: (text: string) => void,
): Promise<CheckResult> => {
  const { captured, failed } = await captureScreens(root, config, log)
  return {
    findings: findingsFrom(captured, failed, config),
    screens: captured.map(({ snapshot }) => ({
      route: snapshot.screen.route,
      screen: screenLabel(snapshot.screen),
      screenshot: snapshot.screenshot,
    })),
  }
}
