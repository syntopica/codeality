/**
 * Project files that never ship, excluded from `knip --production` only: the
 * leading `!` negates, the trailing `!` limits the negation to production mode,
 * so the default run still analyses tests and stories. Without it a test file
 * matched by a production project glob counts as runtime code, and a
 * dependency only the tests import would pass for a production one.
 */
export const PRODUCTION_PROJECT_EXCLUSIONS = [
  '!**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}!',
  '!**/{__tests__,__mocks__,test,tests}/**!',
  '!**/*.stories.{ts,tsx,js,jsx,mdx}!',
]
