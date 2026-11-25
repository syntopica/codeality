import type { ElementBox } from '@/model/ElementBox.js'
import type { InputIcon } from '@/model/InputIcon.js'
import type { IconOffsets } from '@/rules/IconOffsets.js'

// The padding on the text side is the grid an icon should repeat on its own
// side, so a trailing icon is measured against the left padding and a leading
// one against the right.
export const iconOffsetsOf = (
  input: ElementBox,
  icon: InputIcon,
): IconOffsets => {
  const [borderTop, borderRight, borderBottom, borderLeft] = input.borderWidths
  const [paddingTop, paddingRight, paddingBottom, paddingLeft] = input.padding
  const contentCentre =
    (input.y +
      borderTop +
      paddingTop +
      input.y +
      input.height -
      borderBottom -
      paddingBottom) /
    2
  const trailing = icon.side === 'right'
  const gap = trailing
    ? input.x + input.width - borderRight - (icon.x + icon.width)
    : icon.x - (input.x + borderLeft)
  return {
    vertical: Math.abs(icon.y + icon.height / 2 - contentCentre),
    inset: Math.abs(gap - (trailing ? paddingLeft : paddingRight)),
  }
}
