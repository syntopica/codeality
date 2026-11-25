import type { CdpNode } from '@/capture/CdpNode.js'

/** The value of a DevTools node's attribute; undefined when it has none. */
export const attributeOf = (
  node: CdpNode,
  name: string,
): string | undefined => {
  const at = node.attributes?.indexOf(name) ?? -1
  return at < 0 ? undefined : node.attributes?.[at + 1]
}
