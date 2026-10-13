import type { KnipFramework } from './knip-framework'

/**
 * Framework packages that serve the app but are imported only by its config
 * file. `knip --production` drops config files, so it reports `astro` and
 * `nuxt` as unused; both are runtime dependencies. The trailing `!` makes the
 * ignore apply to production mode only, so the default run still checks them.
 */
export const FRAMEWORK_RUNTIME_PACKAGES: Partial<
  Record<KnipFramework, string[]>
> = {
  astro: ['astro!'],
  nuxt: ['nuxt!'],
}
