import { rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createCruiseFixture } from './createCruiseFixture'
import { runCruiseProbe } from './runCruiseProbe'

describe('opt-in project source selection', () => {
  it('does not discover nested workspaces with cwd-only', () => {
    const root = createCruiseFixture({})
    try {
      const run = runCruiseProbe(
        root,
        'process.stdout.write(JSON.stringify(cruiseWorkspaceSelection(root, true, () => { throw Error("must not discover"); })))',
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe(JSON.stringify([root]))
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('retains discovery for default sources', () => {
    const root = createCruiseFixture({})
    try {
      const run = runCruiseProbe(
        root,
        'process.stdout.write(JSON.stringify(cruiseWorkspaceSelection(root, false, () => ["one", "two"])))',
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe('["one","two"]')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
