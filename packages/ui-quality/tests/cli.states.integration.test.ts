import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

// Each defect on the page is display: none until a scroll, a hover or a
// focus shows it, so only the route that enters that state measures it.
describe('codeality-ui routes[].scroll, hover and focus', () => {
  it('measures the state each route asks for, and reports a target that is missing', async () => {
    const findings = await fixtureFindings({
      routes: [
        '/states.html',
        { path: '/states.html?scroll', scroll: 'bottom' },
        { path: '/states.html?hover', hover: 'li.row' },
        { path: '/states.html?focus', focus: '#search' },
        { path: '/states.html?missing', hover: '#absent' },
      ],
    })
    const undersized = (route: string): string[] =>
      findings
        .filter(
          (finding) =>
            finding.route === route && finding.rule === 'undersized-text',
        )
        .map((finding) => finding.subject)
    expect(undersized('/states.html')).toEqual([])
    expect(undersized('/states.html?scroll')).toEqual(['div.cta.shown'])
    expect(undersized('/states.html?hover')).toEqual([
      'main > ul > li.row > span.tip',
    ])
    expect(undersized('/states.html?focus')).toEqual(['main > p.hint'])
    expect(
      findings
        .filter((finding) => finding.rule === 'click-failed')
        .map((finding) => [finding.route, finding.message]),
    ).toEqual([
      [
        '/states.html?missing',
        'nothing matched "#absent" to hover, so the screen behind it was not measured',
      ],
    ])
  }, 120_000)
})
