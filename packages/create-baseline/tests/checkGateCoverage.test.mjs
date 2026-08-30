import { describe, expect, it } from 'vitest'

import { checkGateCoverage } from '../bin/conformance/checkGateCoverage.mjs'

const WIRED = {
  'check:ci':
    'pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes && pnpm knip',
  'check:quality': 'pnpm deps:graph && pnpm type-coverage',
  'check:security': 'pnpm secrets:check && pnpm audit:check',
  'type-check': 'tsc --noEmit',
  lint: 'eslint . --max-warnings 0',
  'format:check': 'prettier --check .',
  test: 'vitest run --coverage',
  dupes: 'baseline-dupes .',
  knip: 'knip',
  'deps:graph': 'depcruise src',
  'type-coverage': 'baseline-type-coverage',
  'secrets:check': 'gitleaks detect --no-banner --redact',
  'audit:check': 'pnpm audit --audit-level=high',
}

describe('checkGateCoverage', () => {
  it('passes a fully wired project', () => {
    expect(checkGateCoverage({ scripts: WIRED })).toEqual([])
  })

  // The union is the assertion, not the split: a project that folds every gate
  // into one entrypoint is conformant.
  it('accepts every gate in a single entrypoint', () => {
    const scripts = {
      ...WIRED,
      'check:ci':
        'pnpm check:quality && pnpm check:security && pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes && pnpm knip',
    }
    expect(checkGateCoverage({ scripts })).toEqual([])
  })

  it('accepts a gate spelled as a bare tool rather than a script', () => {
    const scripts = { ...WIRED }
    delete scripts.knip
    scripts['check:ci'] =
      'pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes && pnpm exec knip'
    expect(checkGateCoverage({ scripts })).toEqual([])
  })

  // The estate's most common failure: check:quality written into package.json
  // by the scaffolder and nothing calling it.
  it('reports a gate whose script exists but is never reached', () => {
    const scripts = { ...WIRED, 'check:quality': 'echo skip' }
    const ids = checkGateCoverage({ scripts }).map((f) => f.id)
    expect(ids).toContain('gate:deps:graph')
    expect(ids).toContain('gate:type-coverage')
  })

  it('routes a missing whole-tree gate into check:quality when fixing', () => {
    const scripts = { ...WIRED, 'check:quality': 'echo skip' }
    const finding = checkGateCoverage({ scripts }).find(
      (f) => f.id === 'gate:type-coverage',
    )
    expect(finding.fix).toEqual({
      kind: 'append-to-script',
      name: 'check:quality',
      value: 'pnpm type-coverage',
    })
  })

  it('routes a missing security gate into check:security when fixing', () => {
    const scripts = { ...WIRED, 'check:security': 'echo skip' }
    const finding = checkGateCoverage({ scripts }).find(
      (f) => f.id === 'gate:secrets',
    )
    expect(finding.fix.name).toBe('check:security')
  })

  it('reports a project with no entrypoints at all', () => {
    const [finding] = checkGateCoverage({ scripts: { lint: 'eslint .' } })
    expect(finding.id).toBe('check-entrypoints')
  })

  // The consumer-t regression: CI runs only check:ci, check:quality exists but
  // nothing reaches it. Appending there leaves the gate red and every --fix
  // pass appends again; the fix must target an entrypoint CI actually runs.
  it('routes the fix to a reachable entrypoint when the preferred one is dead', () => {
    const scripts = { ...WIRED, 'check:ci': 'pnpm type-check && pnpm lint' }
    const workflows = [{ name: 'ci.yml', text: '- run: pnpm run check:ci\n' }]
    const findings = checkGateCoverage({ scripts, workflows })
    const quality = findings.find((f) => f.id === 'gate:deps:graph')
    const security = findings.find((f) => f.id === 'gate:secrets')
    expect(quality.fix.name).toBe('check:ci')
    expect(security.fix.name).toBe('check:ci')
  })

  // When CI reaches no check script at all, appending to whatever it does run
  // put gates inside one repo's `build`. Keep the conventional target instead
  // and let the finding stand until a human wires the pipeline.
  it('keeps the conventional target when CI reaches no check entrypoint', () => {
    const scripts = { ...WIRED, build: 'vite build' }
    const workflows = [{ name: 'ci.yml', text: '- run: pnpm run build\n' }]
    const finding = checkGateCoverage({ scripts, workflows }).find(
      (f) => f.id === 'gate:deps:graph',
    )
    expect(finding.fix.name).toBe('check:quality')
  })
})
