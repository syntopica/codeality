#!/usr/bin/env node
// Lint staged files from the workspace that owns them, not from the repo root.
//
// `eslint <path>` run at the root resolves each plugin's own dependencies
// against the root's node_modules, which in a pnpm workspace does not have
// them: staging a file in a Tailwind template fails with
// `Error: Could not find tailwindcss` before a single rule runs. ESLint finds
// the right config (it walks up from the file) - it is the plugins' runtime
// lookups that need the workspace as the working directory.
//
// Usage:
//   node scripts/lint-staged.mjs <file> [...]   lint each file from its own workspace

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function findWorkspaceRoot(filePath) {
  let dir = dirname(resolve(REPO_ROOT, filePath))
  while (dir.startsWith(REPO_ROOT) && dir !== REPO_ROOT) {
    // `dir` is derived from a path git reported as staged in this repo.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (existsSync(resolve(dir, 'package.json'))) return dir
    dir = dirname(dir)
  }
  return REPO_ROOT
}

function groupByWorkspace(filePaths) {
  const groups = new Map()
  for (const filePath of filePaths) {
    const root = findWorkspaceRoot(filePath)
    const group = groups.get(root) ?? []
    group.push(relative(root, resolve(REPO_ROOT, filePath)))
    groups.set(root, group)
  }
  return groups
}

const files = argv.slice(2)
if (files.length === 0) exit(0)

let failed = false
for (const [workspaceRoot, workspaceFiles] of groupByWorkspace(files)) {
  const label = relative(REPO_ROOT, workspaceRoot) || '.'
  console.log(`eslint (${label}${sep}): ${workspaceFiles.join(' ')}`)
  try {
    execFileSync(
      'pnpm',
      [
        'exec',
        'eslint',
        '--max-warnings',
        '0',
        '--no-warn-ignored',
        ...workspaceFiles,
      ],
      { cwd: workspaceRoot, stdio: 'inherit' },
    )
  } catch {
    failed = true
  }
}

exit(failed ? 1 : 0)
