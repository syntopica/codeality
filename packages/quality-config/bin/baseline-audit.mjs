#!/usr/bin/env node
// Run the existing dated advisory policy only after a complete audit response.
import { resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { classifyAuditAdvisories } from './classifyAuditAdvisories.mjs'
import { parseAuditArguments } from './parseAuditArguments.mjs'
import { readAuditAllowlist } from './readAuditAllowlist.mjs'
import { reportAuditOutcome } from './reportAuditOutcome.mjs'
import { runPackageAudit } from './runPackageAudit.mjs'

export async function runBaselineAudit() {
  try {
    const { level, file } = parseAuditArguments(argv.slice(2))
    const allowlist = await readAuditAllowlist(resolve(cwd(), file))
    const report = runPackageAudit()
    const advisories = Object.values(report.advisories)
    const outcome = classifyAuditAdvisories(
      advisories,
      allowlist,
      level,
      new Date().toISOString().slice(0, 10),
    )
    return reportAuditOutcome(advisories, outcome, level)
  } catch (error) {
    console.error(
      `baseline-audit: ${error instanceof Error ? error.message : 'Could not validate audit response.'}`,
    )
    return 2
  }
}

exit(await runBaselineAudit())
