import { describe, expect, it } from 'vitest'

import { mentionsDom } from '@/inventory/mentionsDom.js'

describe('mentionsDom', () => {
  it.each([
    'document.body.innerHTML = ""',
    'expect(location.href).toBe(x)',
    'window.scrollTo(0, 0)',
    'renderHook(() => useThing())',
    "import { screen } from '@testing-library/react'",
  ])('sees a DOM global or testing-library in %s', (source) => {
    expect(mentionsDom(source)).toBe(true)
  })
  // False positives, verbatim from 10xjoy files that pass under node
  // (app/auth/callback/route.test.ts, src/lib/joy-website-links.test.ts).
  it.each([
    "expect(response.headers.get('location')).toBe('https://10xjoy.com/drafts')",
    "it('returns at most three links in document order', () => {",
    'const { location } = draft',
    'new Blob(["a"])',
  ])('ignores %s', (source) => {
    expect(mentionsDom(source)).toBe(false)
  })
})
