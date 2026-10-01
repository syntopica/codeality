import type { AuthConfig } from '@/config/AuthConfig.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PaletteConfig } from '@/config/PaletteConfig.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { RuleOptions } from '@/config/RuleOptions.js'
import type { ColorScheme } from '@/model/ColorScheme.js'
import type { Viewport } from '@/model/Viewport.js'

export type UiQualityConfig = {
  baseUrl: string
  auth: AuthConfig | null
  routes: RouteConfig[]
  viewports: Viewport[]
  colorSchemes: ColorScheme[]
  palette: PaletteConfig | null
  rules: RuleOptions
  disable: DisableEntry[]
}
