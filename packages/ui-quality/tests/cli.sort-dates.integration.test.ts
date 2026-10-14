import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

describe('codeality-ui sortable date columns', () => {
  it('orders a date column by the datetime of its <time>, not by the words it shows', async () => {
    // "2 jun 2021" is no number and no day/month/year a rule can parse, so
    // read as text a correctly sorted date column looked out of order.
    const findings = await fixtureFindings({ routes: ['/dated.html'] })
    expect(
      findings.filter((finding) => finding.rule === 'sort-broken'),
    ).toEqual([])
  }, 120_000)
})
