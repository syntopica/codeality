import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { initScriptsOf } from '@/capture/initScriptsOf.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

describe('initScriptsOf', () => {
  it('reads each script relative to the project root', () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(join(root, 'stub.js'), 'window.stub = 1')
    expect(initScriptsOf(root, ['stub.js'])).toEqual(['window.stub = 1'])
  })
  it('fails as configuration when a script is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    expect(() => initScriptsOf(root, ['missing.js'])).toThrow(ConfigError)
  })
})
