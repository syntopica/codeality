import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import { ISO_DATE_LANGUAGES } from '@/rules/ISO_DATE_LANGUAGES.js'
import { ISO_DATE_LEAD } from '@/rules/ISO_DATE_LEAD.js'
import type { Rule } from '@/rules/Rule.js'

// "2026-09-30" on a Spanish page is a database value printed as is: its
// reader writes 30/09/2026. Only a text that is wholly a date, or a meta line
// it leads before a separator, is judged: a title that starts with a date
// ("2026-10-11 Alta en Hacienda") is the user's own data. Code and fields
// keep theirs.
export const dateLocale: Rule = (snapshot) => {
  const language = snapshot.lang.split('-')[0] ?? ''
  if (ISO_DATE_LANGUAGES.has(language)) return []
  return snapshot.elements.flatMap((element) => {
    if (!ISO_DATE_LEAD.test(element.text) || element.isTextEntry) return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (chain.some((box) => CODE_TAGS.has(box.tag))) return []
    return [
      {
        rule: 'date-locale',
        severity: 'error',
        message: `"${element.text}" shows an ISO date on a page in "${snapshot.lang}"; format it the way its reader writes dates (Intl.DateTimeFormat)`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
