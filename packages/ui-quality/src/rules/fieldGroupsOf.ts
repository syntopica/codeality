import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import type { FieldGroup } from '@/rules/FieldGroup.js'
import { MAX_LABEL_DISTANCE } from '@/rules/MAX_LABEL_DISTANCE.js'
import { overlapsHorizontally } from '@/rules/overlapsHorizontally.js'

/** The labels of a form, each paired with the field stacked right under it, top to bottom. */
export const fieldGroupsOf = (
  form: ElementBox,
  elements: ElementBox[],
): FieldGroup[] => {
  const inside = descendantsOf(form, elements)
  const controls = inside.filter((element) => element.isControl)
  const taken = new Set<number>()
  const groups: FieldGroup[] = []
  const labels = inside
    .filter((element) => element.tag === 'label' && element.text !== '')
    .toSorted((a, b) => a.y - b.y)
  for (const label of labels) {
    const bottom = label.y + label.height
    const control = controls
      .filter(
        (candidate) =>
          !taken.has(candidate.id) &&
          candidate.y >= bottom &&
          candidate.y - bottom <= MAX_LABEL_DISTANCE &&
          overlapsHorizontally(label, candidate),
      )
      .toSorted((a, b) => a.y - b.y)[0]
    if (!control) continue
    taken.add(control.id)
    groups.push({ label, control })
  }
  return groups
}
