import { describe, expect, it } from 'vitest'

import { selectorAlternatives } from '@/capture/selectorAlternatives.js'

describe('selectorAlternatives', () => {
  it('splits a selector list in written order', () => {
    expect(
      selectorAlternatives(
        'input[type=email], input[name=email],input[type=text]',
      ),
    ).toEqual(['input[type=email]', 'input[name=email]', 'input[type=text]'])
  })
  it('keeps commas inside parentheses, brackets and quotes', () => {
    expect(
      selectorAlternatives(
        ':is(a, b) input, [title="x, y"], [data-k=\'p, q\']',
      ),
    ).toEqual([':is(a, b) input', '[title="x, y"]', "[data-k='p, q']"])
  })
  it('leaves Playwright selector extensions as written', () => {
    // css-what was tried here and rewrites `:has-text("a, b")` with escaped
    // quotes, and throws on `>>`: these are Playwright selectors, not CSS.
    expect(
      selectorAlternatives('button:has-text("Sign, in"), form >> input'),
    ).toEqual(['button:has-text("Sign, in")', 'form >> input'])
  })
  it('drops empty alternatives', () => {
    expect(selectorAlternatives(' a , , b ,')).toEqual(['a', 'b'])
  })
})
