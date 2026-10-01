import type { Page } from 'playwright'

import type { RouteConfig } from '@/config/RouteConfig.js'
import type { Screen } from '@/model/Screen.js'

/** One route to load in an open page and measure. */
export type ScreenRequest = {
  page: Page
  url: string
  route: RouteConfig
  screen: Screen
  screensDir: string
  probe: string
}
