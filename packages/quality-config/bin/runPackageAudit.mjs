import { spawnSync } from 'node:child_process'
import { pnpmCommand } from './pnpmCommand.mjs'
import { readAuditReport } from './readAuditReport.mjs'

export function runPackageAudit() {
  const [pnpm, ...args] = pnpmCommand()
  return readAuditReport(
    spawnSync(pnpm, [...args, 'audit', '--json'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  )
}
