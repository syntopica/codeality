import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui interaction-shift', () => {
  it('reports a toolbar that grows when a toggle is pressed and not its fixed twin, a list filter or the head of a list card', async () => {
    const findings = await fixtureFindings({
      routes: [
        '/shift.html',
        '/shift-clean.html',
        '/shift-filter-clean.html',
        '/shift-panel-clean.html',
      ],
    })
    const on = (route: string) =>
      findings.filter(
        (finding) =>
          finding.route === route && finding.rule === 'interaction-shift',
      )
    const shifts = on('/shift.html')
    expect(shifts.map((finding) => finding.subject)).toEqual([
      'toggle group "View"',
    ])
    expect(shifts[0]?.severity).toBe('error')
    expect(on('/shift-clean.html')).toEqual([])
    expect(on('/shift-filter-clean.html')).toEqual([])
    expect(on('/shift-panel-clean.html')).toEqual([])
  }, 120_000)
})
