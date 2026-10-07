import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui touch-target', () => {
  it('reports small and overlapping tap targets on a phone, and none once they fit', async () => {
    const findings = await fixtureFindings({
      routes: ['/touch.html', '/touch-clean.html'],
      viewports: [
        { width: 1440, height: 900 },
        { width: 390, height: 844, mobile: true },
      ],
    })
    const on = (route: string) =>
      findings.filter(
        (finding) => finding.route === route && finding.rule === 'touch-target',
      )
    const messages = on('/touch.html').map((finding) => finding.message)
    expect(messages.some((message) => message.includes('32x32px'))).toBe(true)
    expect(messages.some((message) => message.includes('overlaps'))).toBe(true)
    expect(messages.some((message) => message.includes('terms'))).toBe(false)
    expect(
      on('/touch.html').every((finding) =>
        finding.screens.every((screen) => screen.startsWith('390x844')),
      ),
    ).toBe(true)
    expect(on('/touch-clean.html')).toEqual([])
  }, 120_000)
})
