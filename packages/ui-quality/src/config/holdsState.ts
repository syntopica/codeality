import type { RouteConfig } from '@/config/RouteConfig.js'

/** Whether a route is measured scrolled, hovered or focused, a state a scroll back to the top would lose. */
export const holdsState = ({ scroll, hover, focus }: RouteConfig): boolean =>
  scroll !== null || hover !== null || focus !== null
