/** The box of an icon a field carries, in document px, and the end of the field it sits at. */
export type InputIcon = {
  /** The field's id in the snapshot. */
  element: number
  side: 'left' | 'right'
  x: number
  y: number
  width: number
  height: number
}
