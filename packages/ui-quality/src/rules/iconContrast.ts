import { blendOver } from '@/color/blendOver.js'
import { contrastRatio } from '@/color/contrastRatio.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { backdropOf } from '@/rules/backdropOf.js'
import { iconOnlyControlOf } from '@/rules/iconOnlyControlOf.js'
import { imageBehind } from '@/rules/imageBehind.js'
import { NON_TEXT_MIN_RATIO } from '@/rules/NON_TEXT_MIN_RATIO.js'
import type { Rule } from '@/rules/Rule.js'

// An icon that is the whole control (a bell, a close cross) is non-text
// content, so WCAG 1.4.11 asks 3:1 against what is behind it. axe checks text
// only; a pale gray-400 bell on white passes every text rule at 2.5:1. The
// icon's colour is its `color`, which outline sets draw with `currentColor`.
export const iconContrast: Rule = (snapshot) => {
  const findings: RawFinding[] = []
  for (const icon of snapshot.elements) {
    if (icon.tag !== 'svg' || !icon.color) continue
    const control = iconOnlyControlOf(icon, snapshot.elements)
    if (!control) continue
    // A gradient button has no single colour to measure against.
    if (imageBehind(icon, snapshot.elements)) continue
    const backdrop = backdropOf(icon, snapshot.elements)
    const ratio = contrastRatio(blendOver(icon.color, backdrop), backdrop)
    if (ratio >= NON_TEXT_MIN_RATIO) continue
    findings.push({
      rule: 'icon-contrast',
      severity: 'error',
      message: `icon-only control has ${ratio.toFixed(2)}:1 contrast against its background; non-text contrast needs ${String(NON_TEXT_MIN_RATIO)}:1`,
      subject: control.selector,
      identity: control.signature,
    })
  }
  return findings
}
