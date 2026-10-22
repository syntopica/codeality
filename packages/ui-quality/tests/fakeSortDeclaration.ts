import type { SortDeclarationNode } from '@/capture/SortDeclarationNode.js'
import type { SortDeclarationRect } from '@/capture/SortDeclarationRect.js'

export const fakeSortDeclaration = (
  value: string | null,
  type: string | null = 'number',
  visible = true,
  rectangles: SortDeclarationRect[] = [{ width: 10, height: 10 }],
): SortDeclarationNode => ({
  getAttribute: (name) => (name === 'data-codeality-sort-value' ? value : type),
  getClientRects: () => rectangles,
  checkVisibility: () => visible,
})
