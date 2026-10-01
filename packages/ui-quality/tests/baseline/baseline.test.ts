import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { baselineActionFrom } from '@/baseline/baselineActionFrom.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import type { Finding } from '@/model/Finding.js'
import { classifyFindings } from '@syntopica/gate-kit/classifyFindings'
import { readBaseline } from '@syntopica/gate-kit/readBaseline'
import { writeBaseline } from '@syntopica/gate-kit/writeBaseline'

const finding = (fingerprint: string) =>
  ({
    fingerprint,
    rule: 'r',
    route: '/',
    screens: [],
    message: 'm',
    subject: '',
    severity: 'error',
  }) as Finding

describe('baseline', () => {
  it('writes, reads and classifies', () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    expect(() => readBaseline(root, BASELINE_FILENAME, 'codeality-ui')).toThrow(
      'not found',
    )
    writeBaseline(root, BASELINE_FILENAME, {
      schemaVersion: 1,
      toolVersion: '0.1.0',
      entries: ['b', 'a'],
    })
    const baseline = readBaseline(root, BASELINE_FILENAME, 'codeality-ui')
    expect(baseline.entries).toEqual(['a', 'b'])
    const classified = classifyFindings([finding('a'), finding('c')], baseline)
    expect(classified.new.map((f) => f.fingerprint)).toEqual(['c'])
    expect(classified.resolved).toEqual(['b'])
    expect(renderClassified(classified)).toMatch(
      /^1 new, 1 known, 1 resolved\n/,
    )
    expect(renderClassified({ new: [], known: [], resolved: [] })).toBe(
      '0 new, 0 known, 0 resolved',
    )
    writeFileSync(
      join(root, '.codeality-ui-baseline.json'),
      '{"schemaVersion":2}',
    )
    expect(() => readBaseline(root, BASELINE_FILENAME, 'codeality-ui')).toThrow(
      'not a version 1 baseline',
    )
  })
  it('parses the action', () => {
    expect(baselineActionFrom(['update'])).toBe('update')
    expect(() => baselineActionFrom(['drop'])).toThrow('usage')
  })
})
