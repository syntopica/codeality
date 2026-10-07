/** One visible `img` or `video` as the probe reports it. */
export type MediaBox = {
  tag: string
  signature: string
  selector: string
  /** The file did not load: no pixels, no source at all, or a video error. */
  broken: boolean
  /**
   * Its box is known before the file loads: width and height attributes, an
   * aspect-ratio, a CSS height, or out of the flow. Broken media count as sized.
   */
  sized: boolean
}
