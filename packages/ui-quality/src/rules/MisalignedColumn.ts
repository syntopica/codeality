import type { ElementBox } from '@/model/ElementBox.js'

export type MisalignedColumn = {
  column: number
  cell: ElementBox
  min: number
  max: number
}
