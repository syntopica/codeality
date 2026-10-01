import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { RawFinding } from '@/model/RawFinding.js'
import type { Screen } from '@/model/Screen.js'
import { screenLabel } from '@/model/screenLabel.js'

export const toFinding = (raw: RawFinding, screen: Screen): Finding => ({
  rule: raw.rule,
  severity: raw.severity,
  route: screen.route,
  screens: [screenLabel(screen)],
  message: raw.message,
  subject: raw.subject,
  fingerprint: fingerprintFinding(
    raw.rule,
    screen.route,
    screen.colorScheme,
    raw.identity,
  ),
})
