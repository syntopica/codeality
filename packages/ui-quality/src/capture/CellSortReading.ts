import type { SortDeclaration } from '@/capture/SortDeclaration.js'

/** Legacy displayed key and optional declaration from one DOM read. */
export type CellSortReading = {
  text: string
  declaration: SortDeclaration | null
}
