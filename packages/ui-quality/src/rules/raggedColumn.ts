import { childrenIndex } from '@/rules/childrenIndex.js'
import { columnEdgesOf } from '@/rules/columnEdgesOf.js'
import { holdsContent } from '@/rules/holdsContent.js'
import { isBlockInFlow } from '@/rules/isBlockInFlow.js'
import { isCardLike } from '@/rules/isCardLike.js'
import { isInMain } from '@/rules/isInMain.js'
import { isProseBlock } from '@/rules/isProseBlock.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import { RAGGED_SHORTFALL } from '@/rules/RAGGED_SHORTFALL.js'
import type { Rule } from '@/rules/Rule.js'
import { showsRightEdge } from '@/rules/showsRightEdge.js'
import { spansColumn } from '@/rules/spansColumn.js'
import { stacksOnLeftEdge } from '@/rules/stacksOnLeftEdge.js'

// Blocks stacked in one column that stop at different right edges: a heading
// capped at `max-w-4xl` and a note at `max-w-3xl` directly above a stat card
// that fills the column. Only a block that starts on the column's left edge,
// sits alone in its row, is next to a block filling the column and shows
// where it ends (a border, a shadow, a fill or text wrapping there) is
// judged; a table takes the width of its content and is left alone.
// Running text keeps its reading measure, except under or over a full-width
// card, where the cap reads as a ragged edge rather than a measure.
export const raggedColumn: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  const children = childrenIndex(elements)
  return elements.flatMap((column) => {
    if (!isInMain(column, elements)) return []
    const blocks = (children.get(column.id) ?? []).filter(isBlockInFlow)
    if (blocks.length < 2) return []
    const edges = columnEdgesOf(column)
    const width = edges.right - edges.left
    return blocks.flatMap((block, index) => {
      const shortfall = edges.right - (block.x + block.width)
      if (shortfall <= width * RAGGED_SHORTFALL) return []
      if (!stacksOnLeftEdge(block, blocks, edges)) return []
      if (block.display === 'table') return []
      if (!holdsContent(block, elements)) return []
      if (!showsRightEdge(block, elements, canvas)) return []
      const full = [blocks[index - 1], blocks[index + 1]].find(
        (neighbour) => neighbour !== undefined && spansColumn(neighbour, edges),
      )
      if (!full) return []
      const prose = isProseBlock(block, children.get(block.id) ?? [])
      if (prose && !isCardLike(full, elements, canvas)) return []
      return [
        {
          rule: 'ragged-column',
          severity: 'error',
          message: `this block ends ${String(Math.round(shortfall))}px (${String(Math.round((shortfall / width) * 100))}%) short of the ${String(Math.round(width))}px column that ${full.selector} next to it fills; give the column one width`,
          subject: block.selector,
          identity: block.signature,
        },
      ]
    })
  })
}
