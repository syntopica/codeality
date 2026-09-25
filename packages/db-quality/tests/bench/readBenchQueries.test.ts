import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readBenchQueries } from '@/bench/readBenchQueries.js'
import { ConfigError } from '@/config/ConfigError.js'

const BENCH_DIR = 'db-quality/bench'

const rootWith = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, BENCH_DIR), { recursive: true })
  for (const [name, content] of Object.entries(files))
    writeFileSync(join(root, BENCH_DIR, name), content)
  return root
}

describe('readBenchQueries', () => {
  it('reads files in name order, taking a -- runs: N override off the first line', () => {
    const root = rootWith({
      'b_second.sql': 'select 2;',
      'a_first.sql': '-- runs: 10\nselect 1; -- trailing comment\n',
    })
    const queries = readBenchQueries(root, BENCH_DIR, 5)
    expect(queries.map((q) => q.file)).toEqual(['a_first.sql', 'b_second.sql'])
    expect(queries[0]).toEqual({
      file: 'a_first.sql',
      sql: 'select 1',
      runs: 10,
    })
    expect(queries[1]?.runs).toBe(5)
  })
  it('throws a ConfigError when benchDir is not a directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(() => readBenchQueries(root, BENCH_DIR, 5)).toThrow(ConfigError)
    expect(() => readBenchQueries(root, BENCH_DIR, 5)).toThrow(
      /db-quality\/bench is not a directory/,
    )
  })
  it('throws a ConfigError naming a file that is empty after stripping comments', () => {
    const root = rootWith({ 'empty.sql': '-- just a comment\n' })
    expect(() => readBenchQueries(root, BENCH_DIR, 5)).toThrow(
      /empty.sql holds no statement/,
    )
  })
})
