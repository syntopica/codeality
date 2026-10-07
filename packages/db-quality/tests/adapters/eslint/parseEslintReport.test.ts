import { describe, expect, it } from 'vitest'

import { parseEslintReport } from '@/adapters/eslint/parseEslintReport.js'

const drizzle = { plugin: 'drizzle', code: 'BDB300' }

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
  it('keeps the kysely plugin under its own family', () => {
    const kysely = JSON.stringify([
      {
        filePath: '/p/src/a.ts',
        messages: [
          { ruleId: 'kysely/delete-without-where', message: 'm', line: 3 },
          {
            ruleId: 'drizzle/enforce-delete-with-where',
            message: 'm',
            line: 4,
          },
        ],
      },
    ])
    expect(
      parseEslintReport(kysely, '/p', [], {
        plugin: 'kysely',
        code: 'BDB310',
      }).map((f) => [f.code, f.line]),
    ).toEqual([['BDB310/delete-without-where', 3]])
  })
  it('keeps only drizzle rules, with root-relative paths', () => {
    const findings = parseEslintReport(stdout, '/p', [], drizzle)
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
      parseEslintReport(
        stdout,
        '/p',
        [{ code: 'BDB300/enforce-delete-with-where', reason: 'test' }],
        drizzle,
      ),
    ).toEqual([])
    expect(parseEslintReport('', '/p', [], drizzle)).toEqual([])
    expect(() => parseEslintReport('Oops!', '/p', [], drizzle)).toThrow(
      /no JSON report/,
    )
  })
})
