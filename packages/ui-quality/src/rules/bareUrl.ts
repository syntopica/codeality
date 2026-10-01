import type { RawFinding } from '@/model/RawFinding.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import type { Rule } from '@/rules/Rule.js'
import { URL_TEXT_PATTERN } from '@/rules/URL_TEXT_PATTERN.js'

// An address printed as plain text: it looks like a link, cannot be clicked,
// and has to be copied by hand. The probe gives each element its own text
// only, so a paragraph whose address sits in a child <a> is not reported.
export const bareUrl: Rule = (snapshot) =>
  snapshot.elements
    .filter(
      (element) =>
        element.tag !== 'a' &&
        URL_TEXT_PATTERN.test(element.text) &&
        !ancestorsOf(element, snapshot.elements).some(
          (ancestor) => ancestor.tag === 'a',
        ),
    )
    .map((element): RawFinding => ({
      rule: 'bare-url',
      severity: 'warn',
      message: `"${element.text.slice(0, 60)}" shows a web address that is not a link; wrap it in <a href>`,
      subject: element.selector,
      identity: element.signature,
    }))
