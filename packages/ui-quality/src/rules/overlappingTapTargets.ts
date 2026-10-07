import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { overlapsPartly } from '@/rules/overlapsPartly.js'

/** Targets that cross another target's box, neither inside the other: a tap may land on either. */
export const overlappingTapTargets = (
  targets: ElementBox[],
  elements: ElementBox[],
): RawFinding[] =>
  targets.flatMap((target, index) => {
    const other = targets
      .slice(index + 1)
      .find(
        (candidate) =>
          overlapsPartly(target, candidate) &&
          !ancestorsOf(candidate, elements).includes(target) &&
          !ancestorsOf(target, elements).includes(candidate),
      )
    if (!other) return []
    return [
      {
        rule: 'touch-target',
        severity: 'warn',
        message: `this tap target overlaps ${other.selector}, so a thumb may hit either; separate them`,
        subject: target.selector,
        identity: `overlap ${target.signature}`,
      },
    ]
  })
