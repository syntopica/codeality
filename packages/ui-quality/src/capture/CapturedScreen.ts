import type { RouteConfig } from '@/config/RouteConfig.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

export type CapturedScreen = { route: RouteConfig; snapshot: PageSnapshot }
