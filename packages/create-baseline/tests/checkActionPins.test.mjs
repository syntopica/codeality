import { describe, expect, it } from 'vitest'

import { checkActionPins } from '../bin/conformance/checkActionPins.mjs'

describe('checkActionPins', () => {
  it('passes a workflow whose actions are pinned to commits', () => {
    const text = `
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6
    `
    expect(checkActionPins({ workflows: [{ name: 'ci.yml', text }] })).toEqual(
      [],
    )
  })

  it('reports a tag-pinned action and says how to resolve it', () => {
    const text = '      - uses: actions/checkout@v6\n'
    const [finding] = checkActionPins({ workflows: [{ name: 'ci.yml', text }] })
    expect(finding.id).toBe('action-pin:actions/checkout@v6')
    expect(finding.detail).toContain('git/ref/tags/v6')
  })

  it('skips local and container actions, which have no tag to move', () => {
    const text = `
      - uses: ./.github/actions/setup
      - uses: docker://alpine:3.20
    `
    expect(checkActionPins({ workflows: [{ name: 'ci.yml', text }] })).toEqual(
      [],
    )
  })

  it('reports each action once, listing every workflow it appears in', () => {
    const workflows = [
      { name: 'ci.yml', text: '- uses: actions/checkout@v4\n' },
      { name: 'release.yml', text: '- uses: actions/checkout@v4\n' },
    ]
    const findings = checkActionPins({ workflows })
    expect(findings).toHaveLength(1)
    expect(findings[0].detail).toContain('ci.yml, release.yml')
  })
})
