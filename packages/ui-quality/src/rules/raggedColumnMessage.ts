import type { ElementBox } from '@/model/ElementBox.js'

/** The finding text: what the block ends short of, and whether a full-width neighbour or its own max-width is the cause. */
export const raggedColumnMessage = (
  block: ElementBox,
  full: ElementBox | undefined,
  width: number,
  shortfall: number,
): string => {
  const column = String(Math.round(width))
  const reason = full
    ? `the ${column}px column that ${full.selector} next to it fills; give the column one width`
    : `the ${column}px column because of its max-width of ${String(Math.round(block.maxWidth ?? 0))}px; remove the cap or let the content fill the column`
  return `this block ends ${String(Math.round(shortfall))}px (${String(Math.round((shortfall / width) * 100))}%) short of ${reason}`
}
