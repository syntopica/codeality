import type { RouteConfig } from '@/config/RouteConfig.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { groupRawFindings } from '@/rules/groupRawFindings.js'
import { resolveAccent } from '@/rules/resolveAccent.js'
import { resolvePalette } from '@/rules/resolvePalette.js'
import { RULES } from '@/rules/RULES.js'

export const runRules = (
  snapshot: PageSnapshot,
  route: RouteConfig,
  config: UiQualityConfig,
): RawFinding[] => {
  const context = {
    options: config.rules,
    route,
    palette: resolvePalette(config.palette, snapshot.variables),
    accent: resolveAccent(config.palette),
    register: config.register,
    enabled: config.enable,
  }
  return groupRawFindings(RULES.flatMap((rule) => rule(snapshot, context)))
}
