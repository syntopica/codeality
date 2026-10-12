import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import { IDENTIFIER_TEXT } from '@/rules/IDENTIFIER_TEXT.js'
import { PLACEHOLDER_PATTERN } from '@/rules/PLACEHOLDER_PATTERN.js'
import type { Rule } from '@/rules/Rule.js'

// A code path's stand-in printed to the person: "[media message]", or an
// identifier such as "purchase:7905" or "taxRate" where a label belongs.
// Identifiers inside code are what the code means.
export const rawPlaceholder: Rule = (snapshot) =>
  snapshot.elements
    .filter(
      (element) =>
        PLACEHOLDER_PATTERN.test(element.text) ||
        (IDENTIFIER_TEXT.test(element.text) &&
          !element.isTextEntry &&
          ![element, ...ancestorsOf(element, snapshot.elements)].some((box) =>
            CODE_TAGS.has(box.tag),
          )),
    )
    .map((element): RawFinding => ({
      rule: 'raw-placeholder',
      severity: 'error',
      message: `"${element.text}" is an implementation placeholder shown as content; render a label in the interface language`,
      subject: element.selector,
      identity: element.signature,
    }))
