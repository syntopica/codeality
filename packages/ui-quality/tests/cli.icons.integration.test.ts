import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

const RULES = new Set([
  'duplicate-nav-icon',
  'mixed-icon-family',
  'transition-all',
])

describe('codeality-ui icons and transitions', () => {
  it('reports a shared nav icon, mixed icon sets and transition: all', async () => {
    const findings = await fixtureFindings({ routes: ['/icons.html'] })
    expect(
      findings
        .filter((finding) => RULES.has(finding.rule))
        .map((finding) => `${finding.rule} ${finding.subject}`)
        .sort(),
    ).toEqual([
      'duplicate-nav-icon Clientes / Contactos',
      'mixed-icon-family main > ul',
      'transition-all main > div.card',
    ])
  }, 120_000)
})
