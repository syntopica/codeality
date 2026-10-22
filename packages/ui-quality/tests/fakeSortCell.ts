import type { SortDeclarationNode } from '@/capture/SortDeclarationNode.js'

export const fakeSortCell = (
  text: string,
  declarations: SortDeclarationNode[] = [],
  time: {
    innerText: string
    getAttribute: (name: string) => string | null
  } | null = null,
) => ({
  innerText: text,
  querySelector: () => time,
  querySelectorAll: () => declarations,
})
