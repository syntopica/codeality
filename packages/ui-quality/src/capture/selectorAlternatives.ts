import { bracketDelta } from '@/capture/bracketDelta.js'
import { nextQuote } from '@/capture/nextQuote.js'

/**
 * The comma-separated alternatives of a selector list, in the order they were
 * written. Commas inside parentheses, brackets or quotes belong to one
 * alternative (`:is(a, b)`, `[title="a, b"]`, `:has-text("a, b")`), and every
 * alternative is kept verbatim: these are Playwright selectors, not plain CSS.
 */
export const selectorAlternatives = (selector: string): string[] => {
  const alternatives: string[] = []
  let start = 0
  let depth = 0
  let quote: string | null = null
  for (let index = 0; index < selector.length; index += 1) {
    const character = selector.charAt(index)
    const quoted = quote !== null
    quote = nextQuote(quote, character)
    if (quoted || quote !== null) continue
    depth += bracketDelta(character)
    if (character !== ',' || depth !== 0) continue
    alternatives.push(selector.slice(start, index).trim())
    start = index + 1
  }
  alternatives.push(selector.slice(start).trim())
  return alternatives.filter((alternative) => alternative !== '')
}
