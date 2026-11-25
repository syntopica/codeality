import type { ElementBox } from '@/model/ElementBox.js'
import type { InputIcon } from '@/model/InputIcon.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import { overlayIconsOf } from '@/rules/overlayIconsOf.js'

/** The icons a field carries: the browser's own picker icon and any laid over it. */
export const inputIconsOf = (
  input: ElementBox,
  snapshot: PageSnapshot,
  children: Map<number, ElementBox[]>,
): InputIcon[] => [
  ...snapshot.inputIcons.filter((icon) => icon.element === input.id),
  ...overlayIconsOf(input, snapshot.elements, children),
]
