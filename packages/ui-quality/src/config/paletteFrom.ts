import { expectConfig } from '@/config/expectConfig.js'
import { HEX_COLOR_PATTERN } from '@/config/HEX_COLOR_PATTERN.js'
import { isRecord } from '@/config/isRecord.js'
import type { PaletteConfig } from '@/config/PaletteConfig.js'
import { stringList } from '@/config/stringList.js'

export const paletteFrom = (value: unknown): PaletteConfig | null => {
  if (value === undefined || value === null) return null
  expectConfig(isRecord(value), 'palette must be an object')
  const colors = stringList(value['colors'], 'palette.colors')
  expectConfig(
    colors.every((color) => HEX_COLOR_PATTERN.test(color)),
    'palette.colors must be #rgb or #rrggbb values',
  )
  return {
    variablePrefixes: stringList(
      value['variablePrefixes'],
      'palette.variablePrefixes',
    ),
    colors,
  }
}
