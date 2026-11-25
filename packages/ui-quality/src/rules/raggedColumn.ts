import { childrenIndex } from '@/rules/childrenIndex.js'
import { columnEdgesOf } from '@/rules/columnEdgesOf.js'
import { isBlockInFlow } from '@/rules/isBlockInFlow.js'
import { isExemptFromRagged } from '@/rules/isExemptFromRagged.js'
import { isInMain } from '@/rules/isInMain.js'
import { isRaggedCandidate } from '@/rules/isRaggedCandidate.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import { RAGGED_SHORTFALL } from '@/rules/RAGGED_SHORTFALL.js'
import { raggedColumnMessage } from '@/rules/raggedColumnMessage.js'
import type { Rule } from '@/rules/Rule.js'
import { spansColumn } from '@/rules/spansColumn.js'

// Blocks stacked in one column that stop at different right edges: a heading
// capped at `max-w-4xl` and a note at `max-w-3xl` directly above a stat card
// that fills the column. Only a block that starts on the column's left edge,
// sits alone in its row, is next to a block filling the column and shows
// where it ends (a border, a shadow, a fill or text wrapping there) is
// judged; a table takes the width of its content and is left alone.
// Running text is judged the same way: no artificial width limits. A block
// whose width is an explicit `max-width` is reported with no neighbour at all,
// a lone capped card or paragraph in a wider column; media and controls are
// left alone, and a centred block never starts on the left edge.
export const raggedColumn: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  const children = childrenIndex(elements)
  const scene = { elements, canvas }
  return elements.flatMap((column) => {
    if (!isInMain(column, elements)) return []
    const blocks = (children.get(column.id) ?? []).filter(isBlockInFlow)
    const edges = columnEdgesOf(column)
    const width = edges.right - edges.left
    return blocks.flatMap((block, index) => {
      const shortfall = edges.right - (block.x + block.width)
      if (shortfall <= width * RAGGED_SHORTFALL) return []
      if (!isRaggedCandidate(block, blocks, edges, scene)) return []
      const full = [blocks[index - 1], blocks[index + 1]].find(
        (neighbour) => neighbour !== undefined && spansColumn(neighbour, edges),
      )
      if (isExemptFromRagged(block, full, children.get(block.id) ?? [], scene))
        return []
      return [
        {
          rule: 'ragged-column',
          severity: 'error',
          message: raggedColumnMessage(block, full, width, shortfall),
          subject: block.selector,
          identity: block.signature,
        },
      ]
    })
  })
}
