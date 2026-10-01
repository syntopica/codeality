import type { Screen } from '@/model/Screen.js'

export const screenshotName = (screen: Screen): string => {
  const route =
    screen.route.replaceAll(/[^\w-]+/g, '_').replaceAll(/^_+|_+$/g, '') ||
    'root'
  return `${route}.${String(screen.viewport.width)}x${String(screen.viewport.height)}.${screen.colorScheme}.png`
}
