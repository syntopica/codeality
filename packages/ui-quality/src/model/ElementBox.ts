import type { Rgba } from '@/model/Rgba.js'

/** One visible element as the in-page probe serialises it; boxes are in document pixels. */
export type ElementBox = {
  id: number
  parent: number | null
  tag: string
  signature: string
  selector: string
  x: number
  y: number
  width: number
  height: number
  /** The element's own text, whitespace collapsed, first 80 characters. */
  text: string
  textLength: number
  textTail: string
  color: Rgba | null
  backgroundColor: Rgba | null
  borderWidths: [number, number, number, number]
  borderColors: [Rgba | null, Rgba | null, Rgba | null, Rgba | null]
  overflowX: string
  textOverflow: string
  scrollWidth: number
  clientWidth: number
  isControl: boolean
  isMain: boolean
}
