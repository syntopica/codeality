import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

export const snapshotOf = (
  elements: ElementBox[],
  overrides: Partial<PageSnapshot> = {},
): PageSnapshot => ({
  elements,
  variables: {},
  viewportWidth: 1440,
  documentWidth: 1440,
  screen: {
    route: '/inbox',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
  axe: [],
  screenshot: '/tmp/inbox.png',
  ...overrides,
})
