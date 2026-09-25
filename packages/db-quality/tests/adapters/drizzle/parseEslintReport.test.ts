import { describe, expect, it } from 'vitest'

import { parseEslintReport } from '@/adapters/drizzle/parseEslintReport.js'

const stdout = JSON.stringify([
  {
    filePath: '/p/src/a.ts',
    messages: [
      {
        ruleId: 'drizzle/enforce-delete-with-where',
        message:
          'Without `.where(...)` you will delete all the rows in a table.',
        line: 7,
      },
      { ruleId: 'no-unused-vars', message: 'x', line: 1 },
      { ruleId: null, message: 'Parsing error', line: 1 },
    ],
  },
  { filePath: '/p/src/b.ts', messages: [] },
])

describe('parseEslintReport', () => {
  it('keeps only drizzle rules, with root-relative paths', () => {
    const findings = parseEslintReport(stdout, '/p', [])
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      code: 'BDB300/enforce-delete-with-where',
      severity: 'error',
      path: 'src/a.ts',
      line: 7,
      subject: 'enforce-delete-with-where',
    })
  })
  it('drops disabled codes, accepts empty output and rejects non-JSON', () => {
    expect(
      parseEslintReport(stdout, '/p', ['BDB300/enforce-delete-with-where']),
    ).toEqual([])
    expect(parseEslintReport('', '/p', [])).toEqual([])
    expect(() => parseEslintReport('Oops!', '/p', [])).toThrow(/no JSON report/)
  })
})
