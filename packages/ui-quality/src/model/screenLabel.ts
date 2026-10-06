import type { Screen } from '@/model/Screen.js'
import { viewportLabel } from '@/model/viewportLabel.js'

export const screenLabel = (screen: Screen): string =>
  `${viewportLabel(screen.viewport)} ${screen.colorScheme}`
