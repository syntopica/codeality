import { describe, expect, it } from 'vitest'

import { duplicateRuns } from '@/rules/duplicateRuns.js'

const A_TEST = '/r/a.test.ts'

describe('duplicateRuns', () => {
  // The verticagtm trap, 2026-10-04: `extends: true` concatenated the root
  // include into the dom project, so every file also ran under jsdom.
  it('flags a file two projects both run', () => {
    const findings = duplicateRuns([
      { file: A_TEST, project: 'dom', environment: 'jsdom' },
      { file: A_TEST, project: 'node', environment: 'node' },
      { file: '/r/b.test.ts', project: 'node', environment: 'node' },
    ])
    expect(findings).toEqual([
      expect.objectContaining({
        rule: 'duplicate-file-run',
        message: '1 of 2 test files run more than once',
        evidence: ['/r/a.test.ts (dom, node)'],
      }),
    ])
  })
  it('names the projects in a stable order whatever order they reported in', () => {
    const [finding] = duplicateRuns([
      { file: A_TEST, project: 'node', environment: 'node' },
      { file: A_TEST, project: 'dom', environment: 'jsdom' },
    ])
    expect(finding?.evidence).toEqual(['/r/a.test.ts (dom, node)'])
  })
  it('passes a suite where each file runs once', () => {
    expect(
      duplicateRuns([
        { file: A_TEST, project: 'dom', environment: 'jsdom' },
        { file: '/r/b.test.ts', project: 'node', environment: 'node' },
      ]),
    ).toEqual([])
  })
})
