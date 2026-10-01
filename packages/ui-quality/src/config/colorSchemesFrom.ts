import { expectConfig } from '@/config/expectConfig.js'
import type { ColorScheme } from '@/model/ColorScheme.js'

export const colorSchemesFrom = (value: unknown): ColorScheme[] => {
  const list = value ?? ['light', 'dark']
  expectConfig(
    Array.isArray(list) &&
      list.length > 0 &&
      list.every((item) => item === 'light' || item === 'dark'),
    'colorSchemes must be a non-empty list of "light" and "dark"',
  )
  return list as ColorScheme[]
}
