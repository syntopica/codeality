import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  interface Assertion<_T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
