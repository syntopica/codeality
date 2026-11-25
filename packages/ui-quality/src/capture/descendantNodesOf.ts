import type { CdpNode } from '@/capture/CdpNode.js'

/** `node` and every node under it, shadow roots included. */
export const descendantNodesOf = (node: CdpNode): CdpNode[] => [
  node,
  ...[...(node.children ?? []), ...(node.shadowRoots ?? [])].flatMap(
    descendantNodesOf,
  ),
]
