import { matchesGlob } from 'node:path'

import { expectConfig } from '@/config/expectConfig.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'

/** The configuration narrowed to the routes whose path matches `glob` (`/admin/**`, `/!(admin)**`). */
export const routesMatching = (
  config: UiQualityConfig,
  glob: string,
): UiQualityConfig => {
  const routes = config.routes.filter((route) => matchesGlob(route.path, glob))
  expectConfig(
    routes.length > 0,
    `--routes ${glob} matches none of the configured routes`,
  )
  return { ...config, routes }
}
