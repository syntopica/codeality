import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { MIN_TAP_TARGET } from '@/rules/MIN_TAP_TARGET.js'

/** Targets whose hit area, pseudo-elements and label included, is under 44px on a side. */
export const smallTapTargets = (targets: ElementBox[]): RawFinding[] =>
  targets
    .filter(
      (target) =>
        target.tapWidth < MIN_TAP_TARGET || target.tapHeight < MIN_TAP_TARGET,
    )
    .map((target) => ({
      rule: 'touch-target',
      severity: 'warn',
      message: `${String(Math.round(target.tapWidth))}x${String(Math.round(target.tapHeight))}px tap target on a phone, under ${String(MIN_TAP_TARGET)}x${String(MIN_TAP_TARGET)}px; pad it or extend its hit area`,
      subject: target.selector,
      identity: `small ${target.signature}`,
    }))
