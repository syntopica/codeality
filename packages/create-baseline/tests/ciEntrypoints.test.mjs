import { describe, expect, it } from 'vitest'

import { ciEntrypoints } from '../bin/conformance/ciEntrypoints.mjs'

describe('ciEntrypoints', () => {
  it('reads the scripts a workflow runs', () => {
    const workflows = [{ name: 'ci.yml', text: '- run: pnpm run check:ci\n' }]
    expect(ciEntrypoints(workflows, { 'check:ci': 'x' })).toEqual(['check:ci'])
  })

  // consumer-g runs every gate as its own step and never says `check:ci`. A
  // name-matching check called the best-wired repo in the estate unwired.
  it('reads gates run as individual steps', () => {
    const text = `
      - run: pnpm run type-check
      - run: pnpm run lint
      - run: pnpm run dupes
    `
    const scripts = { 'type-check': 'x', lint: 'y', dupes: 'z' }
    expect(ciEntrypoints([{ name: 'ci.yml', text }], scripts).sort()).toEqual([
      'dupes',
      'lint',
      'type-check',
    ])
  })

  it('ignores shell that is not a package script', () => {
    const text = '- run: pnpm install --frozen-lockfile\n- run: pnpm audit\n'
    expect(ciEntrypoints([{ name: 'ci.yml', text }], { lint: 'x' })).toEqual([])
  })

  it('reads turbo tasks the root does not define as scripts', () => {
    const text = '- run: turbo run lint test\n'
    expect(ciEntrypoints([{ name: 'ci.yml', text }], {}).sort()).toEqual([
      'lint',
      'test',
    ])
  })

  it('deduplicates across workflows', () => {
    const workflows = [
      { name: 'a.yml', text: 'pnpm run lint' },
      { name: 'b.yml', text: 'pnpm lint' },
    ]
    expect(ciEntrypoints(workflows, { lint: 'x' })).toEqual(['lint'])
  })

  it('returns nothing for a repository with no workflows', () => {
    expect(ciEntrypoints([], { lint: 'x' })).toEqual([])
  })
})
