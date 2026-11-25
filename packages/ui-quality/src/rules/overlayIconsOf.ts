import type { ElementBox } from '@/model/ElementBox.js'
import type { InputIcon } from '@/model/InputIcon.js'
import { INPUT_ICON_TAGS } from '@/rules/INPUT_ICON_TAGS.js'
import { INPUT_ICON_TOLERANCE } from '@/rules/INPUT_ICON_TOLERANCE.js'

/** The text-free absolute siblings laid inside a field's box, in a relatively positioned wrapper: its trailing or leading icons. */
export const overlayIconsOf = (
  input: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): InputIcon[] => {
  const wrapper = input.parent === null ? undefined : elements[input.parent]
  if (!wrapper || wrapper.position === 'static') return []
  const slack = INPUT_ICON_TOLERANCE
  return (children.get(wrapper.id) ?? [])
    .filter(
      (box) =>
        box !== input &&
        INPUT_ICON_TAGS.has(box.tag) &&
        box.position === 'absolute' &&
        box.text === '' &&
        box.height < input.height &&
        box.x >= input.x - slack &&
        box.x + box.width <= input.x + input.width + slack &&
        box.y >= input.y - slack &&
        box.y + box.height <= input.y + input.height + slack,
    )
    .map((box) => ({
      element: input.id,
      side:
        box.x + box.width / 2 > input.x + input.width / 2 ? 'right' : 'left',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    }))
}
