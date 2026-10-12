/** The open dialog of a screen, and the point of its backdrop a click lands on. */
export type ModalReading = {
  /** The dialog as `tag#id` or `tag.class.class`. */
  subject: string
  /** A point on the backdrop, outside the panel, in window px; null when no backdrop shows. */
  point: [number, number] | null
}
