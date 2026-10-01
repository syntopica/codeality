import type { RawFinding } from '@/model/RawFinding.js'
import { PLACEHOLDER_PATTERN } from '@/rules/PLACEHOLDER_PATTERN.js'
import type { Rule } from '@/rules/Rule.js'

export const rawPlaceholder: Rule = (snapshot) =>
  snapshot.elements
    .filter((element) => PLACEHOLDER_PATTERN.test(element.text))
    .map((element): RawFinding => ({
      rule: 'raw-placeholder',
      severity: 'warn',
      message: `"${element.text}" is an implementation placeholder shown as content; render a label in the interface language`,
      subject: element.selector,
      identity: element.signature,
    }))
