/** What `CSS.getComputedStyleForNode` returns. */
export type CdpComputedStyle = {
  computedStyle: { name: string; value: string }[]
}
