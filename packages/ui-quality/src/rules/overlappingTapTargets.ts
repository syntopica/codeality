import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { overlapsPartly } from '@/rules/overlapsPartly.js'
import { scrollsClearOf } from '@/rules/scrollsClearOf.js'
import { visibleTapOverlap } from '@/rules/visibleTapOverlap.js'

/**
 * Targets that cross another target's box, neither inside the other: a tap may
 * land on either. Content a bottom bar covers only until the page scrolls is
 * not a crossing.
 */
export const overlappingTapTargets = (
  targets: ElementBox[],
  snapshot: PageSnapshot,
): RawFinding[] => {
  const { elements } = snapshot
  return targets.flatMap((target, index) => {
    const other = targets
      .slice(index + 1)
      .find(
        (candidate) =>
          overlapsPartly(target, candidate) &&
          visibleTapOverlap(target, candidate) &&
          !ancestorsOf(candidate, elements).includes(target) &&
          !ancestorsOf(target, elements).includes(candidate) &&
          !scrollsClearOf(target, candidate, snapshot) &&
          !scrollsClearOf(candidate, target, snapshot),
      )
    if (!other) return []
    return [
      {
        rule: 'touch-target',
        severity: 'error',
        message: `this tap target overlaps ${other.selector}, so a thumb may hit either; separate them`,
        subject: target.selector,
        identity: `overlap ${target.signature}`,
      },
    ]
  })
}
