import type { AuthConfig } from '@/config/AuthConfig.js'

/** Where a route lives and how to sign in if it asks for a session. */
export type RouteRequest = {
  baseUrl: string
  auth: AuthConfig | null
  statePath: string
}
