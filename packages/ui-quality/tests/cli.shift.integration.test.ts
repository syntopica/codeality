import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui interaction-shift', () => {
  it('reports a toolbar that grows when a toggle is pressed and not its fixed twin', async () => {
    const findings = await fixtureFindings({
      routes: ['/shift.html', '/shift-clean.html'],
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
    expect(shifts[0]?.severity).toBe('warn')
    expect(on('/shift-clean.html')).toEqual([])
  }, 120_000)
})
