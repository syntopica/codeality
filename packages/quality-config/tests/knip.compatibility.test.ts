import { realpathSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createKnipConfig } from '../src/knip'
import { createKnipCompatibilityFixture } from './createKnipCompatibilityFixture'
import type { KnipCompatibilityCase } from './KnipCompatibilityCase'
import type { KnipCompatibilityReport } from './KnipCompatibilityReport'
import { runKnipCompatibilityFixture } from './runKnipCompatibilityFixture'

describe('installed shared ESLint dependency compatibility', () => {
  it.each<KnipCompatibilityCase>([
    'current',
    'legacy',
    'custom',
    'missing-metadata',
    'runner-peer',
  ])('preserves real Knip authority for %s metadata', (kind) => {
    const root = createKnipCompatibilityFixture(kind)
    try {
      const config = createKnipConfig({ framework: 'ts-package', cwd: root })
      const run = runKnipCompatibilityFixture(root)
      expect(run.signal).toBeNull()
      expect(run.error).toBeUndefined()
      const result = JSON.parse(run.stdout) as KnipCompatibilityReport
      expect(realpathSync(result.scope.cwd)).toBe(root)
      expect(realpathSync(result.scope.configFilePath)).toBe(
        join(root, 'knip.config.ts'),
      )
      expect(result.scope.includedWorkspaceDirs).toHaveLength(1)
      expect(realpathSync(result.scope.includedWorkspaceDirs[0] ?? '')).toBe(
        root,
      )
      expect(result.scope.strictConfigHints).toBe(true)
      expect(result.hasConfigLoadErrors).toBe(false)
      expect(result.configurationHints).toEqual([])
      expect(run.status, run.stderr).toBe(kind === 'custom' ? 1 : 0)
      expect(
        config.ignoreDependencies?.includes('eslint-config-prettier'),
      ).toBe(kind === 'missing-metadata')
      expect(result.counters.unlisted).toBe(0)
      expect(result.counters.unresolved).toBe(0)
      expect(result.counters.devDependencies).toBe(kind === 'custom' ? 1 : 0)
      if (kind === 'custom')
        expect(JSON.stringify(result.dependencyIssues)).toContain(
          'eslint-config-prettier',
        )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
