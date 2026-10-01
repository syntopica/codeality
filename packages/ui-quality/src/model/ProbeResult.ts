import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'

/** What `assets/probe.js` returns from inside the page. */
export type ProbeResult = {
  elements: ElementBox[]
  variables: Record<string, Rgba>
  viewportWidth: number
  documentWidth: number
}
