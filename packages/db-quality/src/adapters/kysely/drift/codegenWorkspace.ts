import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// A fresh, private directory for npx to run kysely-codegen from. Inside the
// project, npx would reuse the project's own kysely or pg and skip installing
// them next to kysely-codegen; in the bare temporary directory it would look
// upwards, where on a shared /tmp anyone could plant a package.json,
// node_modules or .npmrc. The empty package.json makes this directory the
// npm project root, so nothing above it is read.
export const codegenWorkspace = (): string => {
  const workspace = mkdtempSync(join(tmpdir(), 'codeality-db-codegen-'))
  writeFileSync(join(workspace, 'package.json'), '{ "private": true }\n')
  return workspace
}
