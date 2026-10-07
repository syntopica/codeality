import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import type { Finding } from '@/model/Finding.js'
import { viewportLabel } from '@/model/viewportLabel.js'
import { toFinding } from '@/report/toFinding.js'

/**
 * One warning for the run when a dark capture is byte for byte its light
 * twin: an app themed by a class or a stored preference ignores
 * `prefers-color-scheme`, so the dark pass measured the light page again.
 */
export const schemeDuplicateFinding = (
  captured: CapturedScreen[],
): Finding | null => {
  const light = new Map(
    captured
      .filter(({ snapshot }) => snapshot.screen.colorScheme === 'light')
      .map(({ snapshot }) => [
        `${snapshot.screen.route} ${viewportLabel(snapshot.screen.viewport)}`,
        snapshot.screenshotDigest,
      ]),
  )
  const dark = captured.filter(
    ({ snapshot }) => snapshot.screen.colorScheme === 'dark',
  )
  const twins = dark.filter(
    ({ snapshot }) =>
      light.get(
        `${snapshot.screen.route} ${viewportLabel(snapshot.screen.viewport)}`,
      ) === snapshot.screenshotDigest,
  )
  const first = twins[0]
  if (!first) return null
  const routes = [
    ...new Set(twins.map(({ snapshot }) => snapshot.screen.route)),
  ]
  return toFinding(
    {
      rule: 'dark-scheme-ignored',
      severity: 'warn',
      message: `the dark capture is identical to the light one on ${String(twins.length)} of ${String(dark.length)} screens (${routes.slice(0, 5).join(', ')}${routes.length > 5 ? ', ...' : ''}): the page ignores prefers-color-scheme, so the dark pass measured nothing new. Set the theme the app reads (routes[].localStorage or an init script), or drop "dark" from colorSchemes`,
      subject: 'colorSchemes',
      identity: 'dark',
    },
    first.snapshot.screen,
  )
}
