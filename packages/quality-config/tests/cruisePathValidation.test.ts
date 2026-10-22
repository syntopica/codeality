import { rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createCruiseFixture } from './createCruiseFixture'
import { runCruiseProbe } from './runCruiseProbe'

describe('cruise alias validation', () => {
  it.each([
    'rebaseCruisePaths({ paths: { x: ["a"] } })',
    'rebaseCruisePaths({ pathsBasePath: "/fixture", paths: { x: [] } })',
    'rebaseCruisePaths({ pathsBasePath: "/fixture", paths: { x: [7] } })',
    'rebaseCruisePaths({ pathsBasePath: "relative", paths: { x: ["a"] } })',
  ])('fails closed for %s', (expression) => {
    const root = createCruiseFixture({})
    try {
      const run = runCruiseProbe(root, expression)
      expect(run.status).not.toBe(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('preserves absolute targets and baseUrl precedence', () => {
    const root = createCruiseFixture({})
    try {
      const run = runCruiseProbe(
        root,
        'process.stdout.write(JSON.stringify(rebaseCruisePaths({ baseUrl: "/base", pathsBasePath: "/wrong", paths: { "~/*": ["/absolute/*", "local/*"] } })))',
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe(
        '{"baseUrl":"/base","paths":{"~/*":["/absolute/*","/base/local/*"]}}',
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
