import type { SortDeclarationRect } from '@/capture/SortDeclarationRect.js'

/** The DOM capabilities needed to admit one rendered declaration. */
export type SortDeclarationNode = {
  getAttribute: (name: string) => string | null
  getClientRects: () => ArrayLike<SortDeclarationRect>
  checkVisibility?: (options: {
    checkOpacity: boolean
    checkVisibilityCSS: boolean
  }) => boolean
}
