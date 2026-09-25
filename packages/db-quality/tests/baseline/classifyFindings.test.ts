import { describe, expect, it } from 'vitest'

import { classifyFindings } from '@/baseline/classifyFindings.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import type { Finding } from '@/model/Finding.js'

const finding = (fingerprint: string): Finding => ({
  code: 'BDB001',
  severity: 'warn',
  path: 'a',
  line: 1,
  message: 'm',
  subject: '',
  fingerprint,
})
const baseline = {
  schemaVersion: 1 as const,
  toolVersion: '0',
  entries: ['bbb', 'ccc'],
}

describe('classifyFindings', () => {
  it('splits findings into new, known and resolved', () => {
    const result = classifyFindings([finding('aaa'), finding('bbb')], baseline)
    expect(result.new.map((f) => f.fingerprint)).toEqual(['aaa'])
    expect(result.known.map((f) => f.fingerprint)).toEqual(['bbb'])
    expect(result.resolved).toEqual(['ccc'])
  })
  it('renders the counts and only the new findings', () => {
    expect(
      renderClassified(
        classifyFindings([finding('aaa'), finding('bbb')], baseline),
      ),
    ).toBe('1 new, 1 known, 1 resolved\na:1: BDB001 m\n1 findings')
    expect(renderClassified(classifyFindings([finding('bbb')], baseline))).toBe(
      '0 new, 1 known, 1 resolved',
    )
  })
})
