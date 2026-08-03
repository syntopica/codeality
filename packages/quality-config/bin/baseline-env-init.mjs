#!/usr/bin/env node
// Bootstraps a project's gitignored `.env` from its committed `.env.example`.
//
// Templates validate `import.meta.env` / `process.env` against a Zod schema at
// startup and fail fast when a required variable is missing. Bundlers inline
// those values at build time, so a freshly cloned project with no `.env` builds
// an artifact that throws before it renders anything - a blank page rather than
// an obvious error. Copying the documented example values on install gives the
// project a working default without ever committing a `.env`.
//
// Idempotent: an existing `.env` is never overwritten, and a project without an
// `.env.example` is a no-op.
import { access, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cwd } from 'node:process'

// Both paths are derived from the invoking project's own working directory,
// which is the whole point of this tool - not untrusted input.
const examplePath = resolve(cwd(), '.env.example')
const targetPath = resolve(cwd(), '.env')

const hasTarget = await access(targetPath).then(
  () => true,
  () => false,
)
const hasExample = await access(examplePath).then(
  () => true,
  () => false,
)

if (hasTarget) {
  console.log('baseline-env-init: .env already exists, left untouched.')
} else if (!hasExample) {
  console.log('baseline-env-init: no .env.example found, nothing to do.')
} else {
  await copyFile(examplePath, targetPath)
  console.log('baseline-env-init: created .env from .env.example.')
}
