import { hexToRgba } from '@/color/hexToRgba.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { PaletteConfig } from '@/config/PaletteConfig.js'
import type { Rgba } from '@/model/Rgba.js'
import type { RuleContext } from '@/rules/RuleContext.js'

/** The configured literal colours plus every root custom property under a configured prefix. */
export const resolvePalette = (
  config: PaletteConfig | null,
  variables: Record<string, Rgba>,
): RuleContext['palette'] => {
  if (!config) return null
  const fromVariables = Object.entries(variables)
    .filter(([name]) =>
      config.variablePrefixes.some((prefix) => name.startsWith(prefix)),
    )
    .map(([, rgba]) => rgba)
  return [...config.colors.map(hexToRgba), ...fromVariables].map((rgba) => ({
    rgba,
    lab: rgbaToLab(rgba),
  }))
}
