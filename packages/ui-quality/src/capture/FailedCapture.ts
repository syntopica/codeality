import type { RouteConfig } from '@/config/RouteConfig.js'
import type { Screen } from '@/model/Screen.js'

/** A screen whose page could not be loaded or measured, twice. */
export type FailedCapture = {
  route: RouteConfig
  screen: Screen
  error: string
}
