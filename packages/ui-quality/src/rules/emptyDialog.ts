import { ACTION_TAGS } from '@/rules/ACTION_TAGS.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { isCloseControl } from '@/rules/isCloseControl.js'
import type { Rule } from '@/rules/Rule.js'

// A phone menu that opens onto a drawer holding nothing but its close button
// passes every other rule: the page looks finished. An open dialog with no
// link, button or field besides its own close control offers nothing to do.
export const emptyDialog: Rule = (snapshot) =>
  snapshot.elements
    .filter((element) => element.isDialog)
    .filter(
      (dialog) =>
        !descendantsOf(dialog, snapshot.elements).some(
          (element) =>
            (ACTION_TAGS.has(element.tag) || element.isControl) &&
            !isCloseControl(element),
        ),
    )
    .map((dialog) => ({
      rule: 'empty-dialog',
      severity: 'warn',
      message:
        'an open dialog or drawer offers no link, button or field besides closing it',
      subject: dialog.selector,
      identity: dialog.selector,
    }))
