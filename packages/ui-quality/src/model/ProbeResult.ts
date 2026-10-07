import type { ElementBox } from '@/model/ElementBox.js'
import type { HiddenText } from '@/model/HiddenText.js'
import type { MediaBox } from '@/model/MediaBox.js'
import type { Rgba } from '@/model/Rgba.js'
import type { RootBackground } from '@/model/RootBackground.js'

/** What `assets/probe.js` returns from inside the page. */
export type ProbeResult = {
  elements: ElementBox[]
  variables: Record<string, Rgba>
  /** The `<html>` then `<body>` backgrounds, outermost first. */
  rootBackgrounds: RootBackground[]
  viewportWidth: number
  viewportHeight: number
  documentWidth: number
  /** Visible images and videos, at most 200. */
  media: MediaBox[]
  hiddenText: HiddenText
}
