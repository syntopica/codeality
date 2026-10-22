import type { SortDeclarationNode } from '@/capture/SortDeclarationNode.js'

/** Cell capabilities used by the atomic browser-side evidence reader. */
export type SortCell = {
  innerText?: string
  querySelector: (selector: string) => {
    innerText?: string
    getAttribute: (name: string) => string | null
  } | null
  querySelectorAll: (selector: string) => ArrayLike<SortDeclarationNode>
}
