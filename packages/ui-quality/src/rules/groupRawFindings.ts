import type { RawFinding } from '@/model/RawFinding.js'
import type { RawFindingGroup } from '@/rules/RawFindingGroup.js'
import { worseMeasurement } from '@/rules/worseMeasurement.js'

/**
 * One finding per rule and identity, counting how many elements raised it.
 * The message keeps the first example; the measurement keeps the worst, so a
 * second element overflowing further is not hidden behind the first.
 */
export const groupRawFindings = (findings: RawFinding[]): RawFinding[] => {
  const groups = new Map<string, RawFindingGroup>()
  for (const finding of findings) {
    const key = `${finding.rule}|${finding.identity}`
    const group = groups.get(key)
    if (group) {
      group.count++
      group.worst = worseMeasurement(group.worst, finding.measurement)
    } else
      groups.set(key, { first: finding, count: 1, worst: finding.measurement })
  }
  return [...groups.values()].map(({ first, count, worst }) => ({
    ...first,
    ...(count === 1
      ? {}
      : {
          message: `${first.message} (and ${String(count - 1)} more like it)`,
        }),
    ...(worst ? { measurement: worst } : {}),
  }))
}
