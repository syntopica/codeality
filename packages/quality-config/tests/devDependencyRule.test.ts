import { rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createDepCruiserConfig } from '../src/dependency-cruiser'
import { createDevDependencyFixture } from './createDevDependencyFixture'
import type { DevDependencyGraph } from './DevDependencyGraph'
import { runDevDependencyProbe } from './runDevDependencyProbe'

describe('development dependency runtime boundary', () => {
  it('uses real emitted categories while preserving genuine dev-only runtime warnings', () => {
    const root = createDevDependencyFixture(
      JSON.stringify(createDepCruiserConfig()),
    )
    try {
      const run = runDevDependencyProbe(root)
      expect(run.status, run.stderr).toBe(0)
      const graph = JSON.parse(run.stdout) as DevDependencyGraph
      const modules = new Map(
        graph.modules.map((entry) => [entry.source, entry.dependencies]),
      )
      const development = modules.get('packages/app/src/development.ts')?.[0]
      const types = modules.get('packages/app/src/type.ts')?.[0]
      const required = modules.get('packages/app/src/required.ts')?.[0]
      const optional = modules.get('packages/app/src/optional.ts')?.[0]
      const production = modules.get('packages/app/src/production.ts')?.[0]
      const declaration = modules.get('packages/app/src/declaration.ts')?.[0]
      expect(development?.dependencyTypes).toContain('npm-dev')
      expect(development?.dependencyTypes).not.toContain('npm-peer')
      expect(development?.dependencyTypes).not.toContain('type-only')
      expect(types?.dependencyTypes).toEqual(
        expect.arrayContaining(['npm-dev', 'type-only']),
      )
      expect(required?.dependencyTypes).toEqual(
        expect.arrayContaining(['npm-dev', 'npm-peer']),
      )
      expect(optional?.dependencyTypes).toEqual(
        expect.arrayContaining(['npm-dev', 'npm-peer']),
      )
      expect(required?.dependencyTypes).not.toContain('type-only')
      expect(optional?.dependencyTypes).not.toContain('type-only')
      expect(production?.dependencyTypes).toContain('npm')
      expect(production?.dependencyTypes).not.toContain('npm-dev')
      expect(declaration?.dependencyTypes).toContain('npm-dev')
      expect(declaration?.dependencyTypes).not.toContain('type-only')
      expect(declaration?.resolved).toMatch(/index\.d\.ts$/)
      expect(development?.couldNotResolve).toBe(false)
      expect(types?.couldNotResolve).toBe(false)
      expect(required?.couldNotResolve).toBe(false)
      expect(optional?.couldNotResolve).toBe(false)
      expect(production?.couldNotResolve).toBe(false)
      expect(declaration?.couldNotResolve).toBe(false)
      const warnings = graph.summary.violations.filter(
        (entry) => entry.rule.name === 'no-dev-dep-in-production-code',
      )
      expect(warnings).toHaveLength(2)
      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: 'packages/app/src/development.ts',
            rule: { name: 'no-dev-dep-in-production-code', severity: 'warn' },
          }),
          expect.objectContaining({
            from: 'packages/app/src/declaration.ts',
            rule: { name: 'no-dev-dep-in-production-code', severity: 'warn' },
          }),
        ]),
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
