import type { ElementBox } from '@/model/ElementBox.js'
import type { InkEdges } from '@/rules/InkEdges.js'

/** The left and right edges of the box a container lays its children in: its border box less horizontal padding. */
export const columnEdgesOf = (column: ElementBox): InkEdges => ({
  left: column.x + column.padding[3],
  right: column.x + column.width - column.padding[1],
})
