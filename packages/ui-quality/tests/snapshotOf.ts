import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

export const snapshotOf = (
  elements: ElementBox[],
  overrides: Partial<PageSnapshot> = {},
): PageSnapshot => ({
  elements,
  variables: {},
  rootBackgrounds: [],
  viewportWidth: 1440,
  viewportHeight: 900,
  documentWidth: 1440,
  media: [],
  hiddenText: { total: 0, hidden: 0, selector: '' },
  backgroundImages: [],
  screen: {
    route: '/inbox',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
  axe: [],
  screenshot: '/tmp/inbox.png',
  screenshotDigest: 'digest',
  consoleErrors: [],
  interactionFailures: [],
  requests: [],
  behaviour: [],
  layoutShift: 0,
  failedImages: [],
  focusStops: [],
  ...overrides,
})
