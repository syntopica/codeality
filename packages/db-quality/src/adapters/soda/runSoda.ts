import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { dataSourceType } from '@/adapters/soda/dataSourceType.js'
import { parseSodaResults } from '@/adapters/soda/parseSodaResults.js'
import { renderSodaConfiguration } from '@/adapters/soda/renderSodaConfiguration.js'
import type { SodaTarget } from '@/adapters/soda/SodaTarget.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// `--with setuptools` and SETUPTOOLS_USE_DISTUTILS are not optional: Soda 4.25
// imports distutils, which Python 3.12 removed. Measured 2026-09-25.
export const runSoda = (
  runner: CommandRunner,
  root: string,
  soda: SodaTarget,
  disabled: DisableEntry[],
): Finding[] => {
  const scratch = mkdtempSync(join(tmpdir(), 'codeality-db-soda-'))
  try {
    const configuration = join(scratch, 'configuration.yml')
    const results = join(scratch, 'results.json')
    writeFileSync(configuration, renderSodaConfiguration('codeality', soda.url))
    const result = runner(
      'uvx',
      [
        '--with',
        'setuptools',
        '--from',
        `soda-core-${dataSourceType(soda.url)}`,
        'soda',
        'scan',
        '-d',
        'codeality',
        '-c',
        configuration,
        '-srf',
        results,
        `${soda.dir}/checks.yml`,
      ],
      { cwd: root, env: { SETUPTOOLS_USE_DISTUTILS: 'local' } },
    )
    if (result.missing) throw new ToolMissingError('uvx', 'install uv')
    if (!existsSync(results)) {
      const tail = result.stderr.trim().slice(-500)
      throw new Error(
        `soda scan produced no results (exit ${String(result.status)}): ${tail}`,
      )
    }
    return parseSodaResults(readFileSync(results, 'utf8'), soda.dir, disabled)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
