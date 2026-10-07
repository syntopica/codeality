import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { hasCaptionNear } from '@/rules/hasCaptionNear.js'
import { NON_LABELLED_INPUT_TYPES } from '@/rules/NON_LABELLED_INPUT_TYPES.js'
import type { Rule } from '@/rules/Rule.js'

// A placeholder vanishes when the person types, so a field named only by one
// leaves them guessing what the value was for. axe's `label` rule passes an
// `aria-label`, which a sighted person never sees. A search box, and a field
// with some text just above or beside it, are left alone.
export const placeholderAsLabel: Rule = (snapshot) =>
  snapshot.elements.flatMap((field) => {
    if (!field.placeholder || field.visibleLabel) return []
    if (
      NON_LABELLED_INPUT_TYPES.has(field.inputType) ||
      field.role === 'searchbox'
    )
      return []
    const chain = ancestorsOf(field, snapshot.elements)
    if (chain.some((box) => box.role === 'search')) return []
    if (hasCaptionNear(field, snapshot.elements)) return []
    return [
      {
        rule: 'placeholder-as-label',
        severity: 'warn',
        message:
          'a field is named only by its placeholder, which disappears when typing starts; add a visible label',
        subject: field.selector,
        identity: field.signature,
      },
    ]
  })
