import type { RawFinding } from '@/model/RawFinding.js'
import type { RawFindingGroup } from '@/rules/RawFindingGroup.js'

/** One finding per rule and identity, counting how many elements raised it. */
export const groupRawFindings = (findings: RawFinding[]): RawFinding[] => {
  const groups = new Map<string, RawFindingGroup>()
  for (const finding of findings) {
    const key = `${finding.rule}|${finding.identity}`
    const group = groups.get(key)
    if (group) group.count++
    else groups.set(key, { first: finding, count: 1 })
  }
  return [...groups.values()].map(({ first, count }) =>
    count === 1
      ? first
      : {
          ...first,
          message: `${first.message} (and ${String(count - 1)} more like it)`,
        },
  )
}
