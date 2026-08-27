#!/usr/bin/env node
// `pnpm audit` with an allowlist that expires.
//
// Usage:
//   baseline-audit [--level low|moderate|high|critical] [--file <path>]
//
// The problem this replaces: two advisories in this repository sat below the
// `--audit-level=high` line and were documented as prose in TODO.md. Nothing
// re-checked them, nothing expired them, and the only way to raise the audit
// level was to accept the noise of findings that had already been judged.
//
// An allowlist entry is a decision with a date on it. `reason` is required and
// `expires` is required, so a waiver comes back on its own and has to be
// re-argued rather than inherited. That is what makes it safe to gate at
// `moderate` instead of `high`: the known exceptions stop being noise.
//
// Allowlist file (`.baseline-advisories.json`), keyed by GitHub advisory ID:
//
//   {
//     "GHSA-w5hq-g745-h8pq": {
//       "reason": "via @lhci/cli > uuid, resolved at 8.3.2; no consumer release past 0.15.1",
//       "expires": "2026-12-31"
//     }
//   }
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'

const LEVELS = ['info', 'low', 'moderate', 'high', 'critical']
const DEFAULT_FILE = '.baseline-advisories.json'

const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? fallback : (argv[index + 1] ?? fallback)
}

const level = flag('level', 'moderate')
if (!LEVELS.includes(level)) {
  console.error(`baseline-audit: --level must be one of ${LEVELS.join(', ')}.`)
  exit(2)
}
const minimum = LEVELS.indexOf(level)
const today = new Date().toISOString().slice(0, 10)
const root = cwd()

const allowlist = await readAllowlist(resolve(root, flag('file', DEFAULT_FILE)))

// `pnpm audit` exits non-zero when it finds anything, which is the whole
// point, so its status is not an error condition here - the JSON is.
const result = spawnSync('pnpm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
if (result.error) {
  console.error(
    `baseline-audit: could not run pnpm audit: ${result.error.message}`,
  )
  exit(2)
}

let report
try {
  report = JSON.parse(result.stdout)
} catch {
  console.error('baseline-audit: pnpm audit did not return JSON.')
  console.error(result.stdout.slice(0, 2000))
  exit(2)
}

const advisories = Object.values(report.advisories ?? {})
const failures = []
const waived = []
const stale = []

for (const advisory of advisories) {
  if (LEVELS.indexOf(advisory.severity) < minimum) continue

  const entry =
    allowlist[advisory.github_advisory_id] ?? allowlist[String(advisory.id)]
  if (!entry) {
    failures.push(advisory)
    continue
  }
  if (entry.expires < today) {
    stale.push({ advisory, entry })
    continue
  }
  waived.push({ advisory, entry })
}

for (const { advisory, entry } of waived) {
  console.log(
    `waived   ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
      `${advisory.module_name}  (expires ${entry.expires})\n         ${entry.reason}`,
  )
}

for (const { advisory, entry } of stale) {
  console.error(
    `EXPIRED  ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
      `${advisory.module_name}  (expired ${entry.expires})\n         ${entry.reason}\n` +
      '         Re-check it, then renew the entry or remove it.',
  )
}

for (const advisory of failures) {
  console.error(
    `FAIL     ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
      `${advisory.module_name} ${advisory.vulnerable_versions}\n` +
      `         patched in ${advisory.patched_versions} - ${advisory.url}\n` +
      `         via ${(advisory.findings?.[0]?.paths ?? []).slice(0, 2).join(', ')}`,
  )
}

const failed = failures.length + stale.length
console.log(
  `\nbaseline-audit: ${advisories.length} advisories, gate at ${level}: ` +
    `${failures.length} unwaived, ${stale.length} expired, ${waived.length} waived.`,
)
if (failed) exit(1)

async function readAllowlist(path) {
  let raw
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }

  const parsed = JSON.parse(raw)
  for (const [id, entry] of Object.entries(parsed)) {
    // Both fields are required, and the check is here rather than at use: an
    // entry missing one is a waiver nobody can audit, and treating it as
    // absent would hide the mistake behind a passing gate.
    if (!entry?.reason || !entry?.expires) {
      console.error(
        `baseline-audit: allowlist entry ${id} needs both \`reason\` and \`expires\`.`,
      )
      exit(2)
    }
  }
  return parsed
}
