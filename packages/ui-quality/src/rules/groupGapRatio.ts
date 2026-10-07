import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { fieldGroupsOf } from '@/rules/fieldGroupsOf.js'
import { groupGapsOf } from '@/rules/groupGapsOf.js'
import { median } from '@/rules/median.js'
import { MIN_GROUP_RATIO } from '@/rules/MIN_GROUP_RATIO.js'
import type { Rule } from '@/rules/Rule.js'

// In a form the label belongs to its field, so the space between two groups
// is at least twice the space inside one (proximity). A form whose groups
// are as far apart as a label is from its field reads as one list of lines.
// Only stacked labels count, and the form's own median decides, so one
// roomy field does not tip it.
export const groupGapRatio: Rule = (snapshot) => {
  const { elements } = snapshot
  return elements.flatMap((form) => {
    const isForm =
      form.tag === 'form' ||
      (form.tag === 'fieldset' &&
        !ancestorsOf(form, elements).some((box) => box.tag === 'form'))
    if (!isForm) return []
    const { within, between } = groupGapsOf(fieldGroupsOf(form, elements))
    if (between.length === 0) return []
    const inner = median(within)
    const outer = median(between)
    if (inner === 0 || outer >= inner * MIN_GROUP_RATIO) return []
    return [
      {
        rule: 'group-gap-ratio',
        severity: 'warn',
        message: `fields are ${String(outer)}px apart but each label is ${String(inner)}px from its own field; keep the space between groups at least ${String(MIN_GROUP_RATIO)}x the space inside one`,
        subject: form.selector,
        identity: form.selector,
      },
    ]
  })
}
