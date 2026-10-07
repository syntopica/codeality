import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { initCommand } from '@/commands/initCommand.js'
import { spawnRunner } from '@/tools/spawnRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const prettierBin = join(
  dirname(createRequire(import.meta.url).resolve('prettier/package.json')),
  'bin/prettier.cjs',
)

describe('initCommand with the project Prettier', () => {
  it('writes files the project prettier --check accepts', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'node_modules/.bin'), { recursive: true })
    symlinkSync(prettierBin, join(root, 'node_modules/.bin/prettier'))
    writeFileSync(
      join(root, '.prettierrc.json'),
      '{ "printWidth": 40, "proseWrap": "always" }\n',
    )
    writeFileSync(join(root, 'package.json'), '{ "name": "consumer" }\n')
    const io = commandIoFor(root, spawnRunner)
    expect(initCommand(['--apply'], io)).toBe(0)
    const readme = readFileSync(
      join(root, 'db-quality/bench/README.md'),
      'utf8',
    )
    expect(readme.split('\n').every((line) => line.length <= 40)).toBe(true)
    expect(() =>
      execFileSync(
        process.execPath,
        [
          prettierBin,
          '--check',
          'codeality-db.json',
          'package.json',
          'db-quality/bench/README.md',
        ],
        { cwd: root, stdio: 'pipe' },
      ),
    ).not.toThrow()
  })
})
