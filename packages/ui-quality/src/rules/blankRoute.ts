import { descendantsOf } from '@/rules/descendantsOf.js'
import { isInk } from '@/rules/isInk.js'
import type { Rule } from '@/rules/Rule.js'

// A route whose main region paints nothing, or that has no main region at
// all: an empty state nobody designed, or a selector that no longer matches.
export const blankRoute: Rule = (snapshot, context) => {
  const main = snapshot.elements.find((element) => element.isMain)
  if (!main) {
    return [
      {
        rule: 'blank-route',
        severity: 'error',
        message: `no visible element matches the main selector "${context.route.main}"`,
        subject: context.route.main,
        identity: 'no-main',
      },
    ]
  }
  if (descendantsOf(main, snapshot.elements).some(isInk) || main.text !== '')
    return []
  return [
    {
      rule: 'blank-route',
      severity: 'error',
      message: 'the main region renders nothing',
      subject: main.selector,
      identity: 'empty-main',
    },
  ]
}
