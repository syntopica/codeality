import type { CdpComputedStyle } from '@/capture/CdpComputedStyle.js'

/** One property of a DevTools computed style; undefined when absent. */
export const computedValueOf = (
  style: CdpComputedStyle,
  name: string,
): string | undefined =>
  style.computedStyle.find((property) => property.name === name)?.value
