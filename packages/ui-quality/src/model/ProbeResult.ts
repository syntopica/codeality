import type { BackgroundImage } from '@/model/BackgroundImage.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { HiddenText } from '@/model/HiddenText.js'
import type { MediaBox } from '@/model/MediaBox.js'
import type { MotionRecord } from '@/model/MotionRecord.js'
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
  /** `scrollHeight` of the document element: how tall the page runs. */
  documentHeight: number
  /** The root's computed `color-scheme`, `normal` when it sets none. */
  rootColorScheme: string
  /** A `meta[name=theme-color]` applies to this colour scheme: it has no `media`, or its media matches. */
  hasThemeColor: boolean
  /** Visible images and videos, at most 200. */
  media: MediaBox[]
  hiddenText: HiddenText
  /** CSS background images of visible elements, data: URLs aside, at most 200. */
  backgroundImages: BackgroundImage[]
  /** The animations running when the probe ran, transitions aside. */
  animations: MotionRecord[]
}
