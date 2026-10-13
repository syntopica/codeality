import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readBaseline } from '../src/readBaseline.js'
import { writeBaseline } from '../src/writeBaseline.js'

const FILE = '.baseline.json'
const record = { metric: 'overflow-excess-px/v1', context: '390', observed: 7 }

const withDocument = (document: unknown): string => {
  const root = mkdtempSync(join(tmpdir(), 'gk-measure-'))
  writeFileSync(join(root, FILE), JSON.stringify(document))
  return root
}

describe('baseline measurements on disk', () => {
  it('round-trips measurements and omits the key when there are none', () => {
    const root = mkdtempSync(join(tmpdir(), 'gk-measure-'))
    writeBaseline(root, FILE, {
      schemaVersion: 1,
      toolVersion: '2',
      entries: ['b', 'a'],
      measurements: { b: [record], a: [record] },
    })
    expect(
      Object.keys(readBaseline(root, FILE, 't').measurements ?? {}),
    ).toEqual(['a', 'b'])
    writeBaseline(root, FILE, {
      schemaVersion: 1,
      toolVersion: '2',
      entries: ['a'],
    })
    expect(readFileSync(join(root, FILE), 'utf8')).not.toContain('measurements')
  })

  it('reads a baseline written before measurements existed', () => {
    const root = withDocument({
      schemaVersion: 1,
      toolVersion: '1',
      entries: ['a'],
    })
    expect(readBaseline(root, FILE, 't')).not.toHaveProperty('measurements')
  })

  it.each([
    ['not an object', []],
    ['an orphan key', { z: [record] }],
    ['a non-finite value', { a: [{ ...record, observed: null }] }],
    ['a missing context', { a: [{ metric: 'm', observed: 1 }] }],
    ['a null record', { a: [null] }],
    ['a duplicate metric and context', { a: [record, record] }],
  ])('refuses measurements with %s', (_, measurements) => {
    const root = withDocument({
      schemaVersion: 1,
      toolVersion: '1',
      entries: ['a'],
      measurements,
    })
    expect(() => readBaseline(root, FILE, 't')).toThrow(/measurements/u)
  })
})
