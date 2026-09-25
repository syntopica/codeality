import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BenchQuery } from '@/bench/BenchQuery.js'
import { RUNS_HEADER } from '@/bench/RUNS_HEADER.js'
import { ConfigError } from '@/config/ConfigError.js'
import { isDirectory } from '@/config/isDirectory.js'
import { isPositiveInteger } from '@/config/isPositiveInteger.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

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
      if (!isPositiveInteger(runs))
        throw new ConfigError(`${name}: -- runs: must be a positive integer`)
      const statements = splitSqlStatements(raw)
      const sql = statements[0]?.text
      if (sql === undefined) throw new ConfigError(`${name} holds no statement`)
      // A clear message, not the boundary: the server enforces that one.
      if (statements.length > 1)
        throw new ConfigError(
          `${name} holds more than one statement; a bench file is one statement`,
        )
      return { file: name, sql, runs }
    })
}
