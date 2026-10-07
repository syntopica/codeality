import { blendOver } from '@/color/blendOver.js'
import { fillBehind } from '@/rules/fillBehind.js'
import { isGrayOnColor } from '@/rules/isGrayOnColor.js'
import { isPainted } from '@/rules/isPainted.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'

// Grey text laid on a coloured fill goes muddy: the grey is neutral, the fill
// is not, and the pair reads as dirty and low contrast whatever the ratio
// says. Text on a gradient or an image is not judged, since its backdrop
// cannot be read; a disabled control is grey on purpose.
export const grayOnColor: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  return elements.flatMap((element) => {
    if (element.text === '' || element.disabled || !isPainted(element.color))
      return []
    const background = fillBehind(element, elements, canvas)
    if (!background) return []
    const ink = blendOver(element.color, background)
    if (!isGrayOnColor(ink, background)) return []
    return [
      {
        rule: 'gray-on-color',
        severity: 'warn',
        message:
          'grey text on a coloured background looks muddy; use a darker or lighter shade of the background colour, or white or black',
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
