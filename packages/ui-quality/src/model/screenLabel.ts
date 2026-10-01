import type { Screen } from '@/model/Screen.js'

export const screenLabel = (screen: Screen): string =>
  `${String(screen.viewport.width)}x${String(screen.viewport.height)} ${screen.colorScheme}`
