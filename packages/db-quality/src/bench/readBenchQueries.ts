import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BenchQuery } from '@/bench/BenchQuery.js'
import { RUNS_HEADER } from '@/bench/RUNS_HEADER.js'
import { ConfigError } from '@/config/ConfigError.js'
import { isDirectory } from '@/config/isDirectory.js'
import { stripSqlComments } from '@/sql/stripSqlComments.js'

export const readBenchQueries = (
  root: string,
  benchDir: string,
  defaultRuns: number,
): BenchQuery[] => {
  const dir = join(root, benchDir)
  if (!isDirectory(dir)) throw new ConfigError(`${benchDir} is not a directory`)
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => {
      const raw = readFileSync(join(dir, name), 'utf8')
      const match = RUNS_HEADER.exec(raw)
      const runs = match?.[1] ? Number(match[1]) : defaultRuns
      let sql = stripSqlComments(raw).trim()
      if (sql.endsWith(';')) sql = sql.slice(0, -1).trim()
      if (sql === '') throw new ConfigError(`${name} holds no statement`)
      return { file: name, sql, runs }
    })
}
