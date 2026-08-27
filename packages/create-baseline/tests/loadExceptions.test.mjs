import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { loadExceptions } from '../bin/conformance/loadExceptions.mjs'

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-exceptions-'))
})

const write = (value) =>
  writeFile(join(root, 'baseline.exceptions.json'), JSON.stringify(value))

describe('loadExceptions', () => {
  it('is empty and silent when there is no file', async () => {
    const { waived, findings } = await loadExceptions(root, '2026-08-27')
    expect(waived.size).toBe(0)
    expect(findings).toEqual([])
  })

  it('honours a waiver that carries a reason', async () => {
    await write({ 'gate:knip': { reason: 'generated code' } })
    const { waived } = await loadExceptions(root, '2026-08-27')
    expect(waived.get('gate:knip').reason).toBe('generated code')
  })

  // A silent waiver and a missing gate look identical from outside, which is
  // the whole thing this file exists to prevent.
  it('rejects a waiver with no reason', async () => {
    await write({ 'gate:knip': {} })
    const { waived, findings } = await loadExceptions(root, '2026-08-27')
    expect(waived.size).toBe(0)
    expect(findings[0].message).toContain('no reason')
  })

  // The prose exceptions in TODO.md were never re-checked. An expiry is what
  // makes a waiver come back on its own.
  it('turns an expired waiver into a finding of its own', async () => {
    await write({
      'gate:dupes': { reason: 'pending refactor', expires: '2026-01-01' },
    })
    const { waived, findings } = await loadExceptions(root, '2026-08-27')
    expect(waived.size).toBe(0)
    expect(findings[0].message).toContain('expired on 2026-01-01')
  })

  it('keeps a waiver that has not expired yet', async () => {
    await write({ 'gate:dupes': { reason: 'r', expires: '2027-01-01' } })
    const { waived } = await loadExceptions(root, '2026-08-27')
    expect(waived.has('gate:dupes')).toBe(true)
  })

  it('reports an unparseable file rather than ignoring it', async () => {
    await writeFile(join(root, 'baseline.exceptions.json'), '{ not json')
    const { findings } = await loadExceptions(root, '2026-08-27')
    expect(findings[0].id).toBe('exceptions')
  })
})
