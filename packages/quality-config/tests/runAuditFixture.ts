import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function runAuditFixture(options: {
  readonly report?: unknown
  readonly stdout?: string
  readonly status?: number
  readonly allowlist?: unknown
  readonly level?: string
}) {
  const root = mkdtempSync(join(tmpdir(), 'audit-response-'))
  try {
    cpSync(new URL('../bin', import.meta.url), join(root, 'bin'), {
      recursive: true,
    })
    const stdout =
      options.stdout !== undefined
        ? options.stdout
        : options.report === undefined
          ? ''
          : JSON.stringify(options.report)
    const manager = join(root, 'manager.cjs')
    writeFileSync(
      manager,
      `if (JSON.stringify(process.argv.slice(2)) !== '["audit","--json"]') process.exit(79); process.stdout.write(${JSON.stringify(stdout)}); process.exit(${String(options.status ?? 1)});`,
    )
    if (options.allowlist !== undefined) {
      writeFileSync(
        join(root, '.baseline-advisories.json'),
        typeof options.allowlist === 'string'
          ? options.allowlist
          : JSON.stringify(options.allowlist),
      )
    }
    return spawnSync(
      process.execPath,
      [
        join(root, 'bin/baseline-audit.mjs'),
        '--level',
        options.level ?? 'moderate',
      ],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 10_000,
        env: { ...process.env, PATH: '', npm_execpath: manager },
      },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
