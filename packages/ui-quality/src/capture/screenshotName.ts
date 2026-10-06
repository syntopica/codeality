import type { Screen } from '@/model/Screen.js'
import { viewportLabel } from '@/model/viewportLabel.js'

export const screenshotName = (screen: Screen): string => {
  const route =
    screen.route.replaceAll(/[^\w-]+/g, '_').replaceAll(/^_+|_+$/g, '') ||
    'root'
  const size = viewportLabel(screen.viewport).replace(' ', '-')
  return `${route}.${size}.${screen.colorScheme}.png`
}
