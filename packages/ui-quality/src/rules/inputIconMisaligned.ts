import { childrenIndex } from '@/rules/childrenIndex.js'
import { iconOffsetsOf } from '@/rules/iconOffsetsOf.js'
import { INPUT_ICON_TOLERANCE } from '@/rules/INPUT_ICON_TOLERANCE.js'
import { inputIconsOf } from '@/rules/inputIconsOf.js'
import { NON_ICON_INPUT_TYPES } from '@/rules/NON_ICON_INPUT_TYPES.js'
import type { Rule } from '@/rules/Rule.js'

// An icon inside a field should sit on the field's vertical centre and as far
// from its edge as the text does from the other. The date picker's own icon is
// measured through DevTools (the capture's `inputIcons`); an icon laid over a
// text field is a text-free absolute sibling in a positioned wrapper.
export const inputIconMisaligned: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  return snapshot.elements
    .filter(
      (input) =>
        input.tag === 'input' &&
        input.inputType !== '' &&
        !NON_ICON_INPUT_TYPES.has(input.inputType),
    )
    .flatMap((input) =>
      inputIconsOf(input, snapshot, children).flatMap((icon) => {
        const { vertical, inset } = iconOffsetsOf(input, icon)
        if (vertical <= INPUT_ICON_TOLERANCE && inset <= INPUT_ICON_TOLERANCE)
          return []
        return [
          {
            rule: 'input-icon-misaligned',
            severity: 'error' as const,
            message: `the ${icon.side === 'right' ? 'trailing' : 'leading'} icon sits ${String(Math.round(vertical))}px off the field's vertical centre and ${String(Math.round(inset))}px off its padding grid; centre it and inset it by the field's padding`,
            subject: input.selector,
            identity: `${input.selector}:${icon.side}`,
          },
        ]
      }),
    )
}
