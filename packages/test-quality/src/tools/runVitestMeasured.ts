import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { env, execPath } from 'node:process'

import type { VitestRun } from '@/model/VitestRun.js'
import { readJsonReport } from '@/tools/readJsonReport.js'
import { resolveVitestBin } from '@/tools/resolveVitestBin.js'
import { startRssSampler } from '@/tools/startRssSampler.js'
import { waitForExit } from '@/tools/waitForExit.js'

/**
 * Runs the project's own vitest with a JSON report beside the default one,
 * sampling the memory of vitest and every worker it starts once a second.
 */
export const runVitestMeasured = async (
  root: string,
  args: string[],
): Promise<VitestRun> => {
  const vitest = resolveVitestBin(root)
  const dir = mkdtempSync(join(tmpdir(), 'codeality-test-'))
  const reportPath = join(dir, 'report.json')
  const started = Date.now()
  const child = spawn(
    execPath,
    [
      vitest,
      'run',
      '--reporter=default',
      '--reporter=json',
      `--outputFile.json=${reportPath}`,
      ...args,
    ],
    { cwd: root, env: { ...env, NO_COLOR: '1', FORCE_COLOR: '0' } },
  )
  const stopSampling = startRssSampler(child.pid)
  let stdout = ''
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString()
  })
  const exitCode = await waitForExit(child)
  const rssSamplesMb = stopSampling()
  const report = readJsonReport(reportPath)
  rmSync(dir, { recursive: true, force: true })
  const wallSeconds = (Date.now() - started) / 1000
  return { exitCode, stdout, report, wallSeconds, rssSamplesMb }
}
