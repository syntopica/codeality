/** A running animation (a CSS transition aside), as read from `document.getAnimations()`. */
export type MotionRecord = {
  selector: string
  signature: string
  /** The animated element's box, in px. */
  width: number
  height: number
  /** The CSS properties its keyframes change, in the DOM's camelCase. */
  properties: string[]
  /** It scales: a `scale` property or a `scale(...)` in its transform. */
  scales: boolean
  /** It repeats for ever. */
  infinite: boolean
  /** One iteration's length in ms. */
  duration: number
}
