import type { Lab } from '@/color/Lab.js'
import type { Register } from '@/config/Register.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { RuleOptions } from '@/config/RuleOptions.js'
import type { Rgba } from '@/model/Rgba.js'

export type RuleContext = {
  options: RuleOptions
  route: RouteConfig
  /** The resolved palette, or null when the project declares none. */
  palette: { rgba: Rgba; lab: Lab }[] | null
  /** `palette.accent`, or null when the project names none. */
  accent: Rgba | null
  /** `register`: the rules that only a product UI is held to read it. */
  register: Register | null
}
