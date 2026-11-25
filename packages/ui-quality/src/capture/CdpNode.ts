/** The part of a DevTools DOM node this package reads. */
export type CdpNode = {
  nodeId: number
  attributes?: string[]
  children?: CdpNode[]
  shadowRoots?: CdpNode[]
}
