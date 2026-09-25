import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { loadTypeScript } from '@/postgrest/loadTypeScript.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

describe('loadTypeScript', () => {
  it('loads the compiler from the first base that resolves it', () => {
    const empty = join(mkdtempSync(join(tmpdir(), 'dbq-ts-')), 'package.json')
    const ts = loadTypeScript([empty, import.meta.url])
    expect(typeof ts.createSourceFile).toBe('function')
  })
  it('throws ToolMissingError when no base resolves it', () => {
    const empty = join(mkdtempSync(join(tmpdir(), 'dbq-ts-')), 'package.json')
    expect(() => loadTypeScript([empty])).toThrow(ToolMissingError)
    expect(() => loadTypeScript([empty])).toThrow(/PostgREST rules/)
  })
})
