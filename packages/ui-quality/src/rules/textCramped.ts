import { crampedInsetsOf } from '@/rules/crampedInsetsOf.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'
import { TABULAR_TAGS } from '@/rules/TABULAR_TAGS.js'
import { textInsetFloor } from '@/rules/textInsetFloor.js'

// The sibling of `control-inset` for everything that is not a field: a card,
// a callout, a button or a chip that draws an edge (a border, or a fill that
// differs from what is behind it) and puts its text closer than 8px to it
// (6px under 24px tall). Glyph extents are measured, so a short line in a
// wide box is not mistaken for text against the edge, and only the sides a
// border or a fill actually draws count: a list row with a top rule has no
// side for text to touch. Table parts are left alone, and so are texts that
// overflow, which `text-clipped` reports.
export const textCramped: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  return elements.flatMap((box) => {
    if (box.isControl || TABULAR_TAGS.has(box.tag)) return []
    const tight = crampedInsetsOf(box, elements, canvas)
    if (tight.length === 0) return []
    return [
      {
        rule: 'text-cramped',
        severity: 'warn',
        message: `text sits ${String(Math.min(...tight))}px from the edge of its box; keep at least ${String(textInsetFloor(box))}px of padding`,
        subject: box.selector,
        identity: box.signature,
      },
    ]
  })
}
