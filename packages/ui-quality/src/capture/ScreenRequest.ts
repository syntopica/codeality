import type { Page } from 'playwright'

import type { RouteRequest } from '@/capture/RouteRequest.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import type { Screen } from '@/model/Screen.js'

/** One route to load in an open page and measure. */
export type ScreenRequest = RouteRequest & {
  page: Page
  route: RouteConfig
  screen: Screen
  screensDir: string
  probe: string
  /** Whether to sort and search the screen after measuring it. */
  exercise: boolean
}
