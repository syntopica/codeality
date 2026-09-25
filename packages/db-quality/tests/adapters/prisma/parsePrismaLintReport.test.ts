import { describe, expect, it } from 'vitest'

import { parsePrismaLintReport } from '@/adapters/prisma/parsePrismaLintReport.js'

const stderr =
  '{"violations":[{"ruleName":"require-field-index","message":"Field \\"updatedBy\\" must have an index.","fileName":"prisma/schema.prisma","location":{"startLine":730,"startColumn":3,"endLine":730,"endColumn":31}}]}'

describe('parsePrismaLintReport', () => {
  it('maps a violation to a BDB200 finding', () => {
    expect(parsePrismaLintReport(stderr, [])[0]).toMatchObject({
      code: 'BDB200/require-field-index',
      severity: 'warn',
      path: 'prisma/schema.prisma',
      line: 730,
      subject: 'updatedBy',
    })
  })
  it('drops disabled codes, accepts empty output, rejects garbage', () => {
    expect(
      parsePrismaLintReport(stderr, ['BDB200/require-field-index']),
    ).toEqual([])
    expect(parsePrismaLintReport('', [])).toEqual([])
    expect(() => parsePrismaLintReport('Error: boom', [])).toThrow(
      /no JSON report/,
    )
  })
})
