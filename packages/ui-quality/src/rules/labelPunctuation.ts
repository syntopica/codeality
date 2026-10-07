import { labelPunctuationOf } from '@/rules/labelPunctuationOf.js'
import type { Rule } from '@/rules/Rule.js'

// Opt-in, through `enable: ["label-punctuation"]`: question pages in the
// GOV.UK style leave the colon off a label and mark the optional fields
// instead of the required ones, but many design systems use the asterisk, so
// nothing is reported unless a project asks for the convention.
export const labelPunctuation: Rule = (snapshot, context) => {
  if (!context.enabled.includes('label-punctuation')) return []
  return snapshot.elements.flatMap((element) => {
    const fault = labelPunctuationOf(element, snapshot.elements)
    if (!fault) return []
    return [
      {
        rule: 'label-punctuation',
        severity: 'warn',
        message: `a label has ${fault}; leave the colon off and mark the optional fields instead`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
