import type { FieldGroup } from '@/rules/FieldGroup.js'
import type { GroupGaps } from '@/rules/GroupGaps.js'

/** The space inside each group (label to field) and between consecutive groups (field to next label), in px. */
export const groupGapsOf = (groups: FieldGroup[]): GroupGaps => ({
  within: groups.map(
    ({ label, control }) => control.y - (label.y + label.height),
  ),
  between: groups.flatMap(({ control }, index) => {
    const next = groups[index + 1]
    if (!next) return []
    const gap = next.label.y - (control.y + control.height)
    return gap >= 0 ? [gap] : []
  }),
})
