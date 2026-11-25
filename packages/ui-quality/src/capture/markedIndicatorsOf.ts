import { attributeOf } from '@/capture/attributeOf.js'
import { CALENDAR_INDICATOR_PSEUDO } from '@/capture/CALENDAR_INDICATOR_PSEUDO.js'
import type { CdpNode } from '@/capture/CdpNode.js'
import { DATE_INPUT_MARK } from '@/capture/DATE_INPUT_MARK.js'
import { descendantNodesOf } from '@/capture/descendantNodesOf.js'
import type { MarkedIndicator } from '@/capture/MarkedIndicator.js'

/** The picker icon of every marked input in a DevTools document tree. */
export const markedIndicatorsOf = (root: CdpNode): MarkedIndicator[] =>
  descendantNodesOf(root).flatMap((input) => {
    const [id, side] = (attributeOf(input, DATE_INPUT_MARK) ?? '').split(':')
    const indicator = descendantNodesOf(input).find(
      (node) => attributeOf(node, 'pseudo') === CALENDAR_INDICATOR_PSEUDO,
    )
    return indicator && id && (side === 'left' || side === 'right')
      ? [{ element: Number(id), side, nodeId: indicator.nodeId }]
      : []
  })
