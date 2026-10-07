import { hexToRgba } from '@/color/hexToRgba.js'
import type { PaletteConfig } from '@/config/PaletteConfig.js'
import type { Rgba } from '@/model/Rgba.js'

/** The configured accent colour, or null when the project names none. */
export const resolveAccent = (config: PaletteConfig | null): Rgba | null =>
  config?.accent ? hexToRgba(config.accent) : null
