import type { ElementBox } from '@/model/ElementBox.js'
import { MIN_SPIKE } from '@/rules/MIN_SPIKE.js'
import { SPIKE_FACTOR } from '@/rules/SPIKE_FACTOR.js'
import { SPIKE_WINDOW } from '@/rules/SPIKE_WINDOW.js'

/**
 * A length far more common than every length near it: snippets cut to N
 * characters pile up at N while natural text spreads smoothly. Catches the
 * cut when a few longer texts from another source (a subject line) sit in
 * the same column and hide it from the longest-length tie.
 */
export const spikeLength = (
  texts: ElementBox[],
  minLength: number,
): number | null => {
  const counts = new Map<number, number>()
  for (const { textLength } of texts) {
    if (textLength >= minLength)
      counts.set(textLength, (counts.get(textLength) ?? 0) + 1)
  }
  for (const [length, count] of counts) {
    if (count < MIN_SPIKE) continue
    const neighbours = [...counts]
      .filter(
        ([other]) =>
          other !== length && Math.abs(other - length) <= SPIKE_WINDOW,
      )
      .map(([, other]) => other)
    if (count >= SPIKE_FACTOR * Math.max(1, ...neighbours)) return length
  }
  return null
}
