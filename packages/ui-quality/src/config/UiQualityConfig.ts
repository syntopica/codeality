import type { AuthConfig } from '@/config/AuthConfig.js'
import type { AxeConfig } from '@/config/AxeConfig.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PaletteConfig } from '@/config/PaletteConfig.js'
import type { Register } from '@/config/Register.js'
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
  /** `product` switches on the rules that hold a working UI to house limits; null when not given. */
  register: Register | null
  rules: RuleOptions
  disable: DisableEntry[]
  axe: AxeConfig
  /**
   * Scripts run in every page before the app's own, relative to the project
   * root: a stub for a desktop shell's IPC bridge, a fixed clock.
   */
  initScripts: string[]
}
