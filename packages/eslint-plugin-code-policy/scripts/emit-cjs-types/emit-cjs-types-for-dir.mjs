import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { cjsHasBareDefaultExport } from './cjs-has-bare-default-export.mjs'
import { rewriteAsCommonJsDefaultExport } from './rewrite-as-common-js-default-export.mjs'

// Duplicates every ".d.ts" under `dir` as a ".d.cts" sibling: the ".cts"
// extension forces TypeScript to resolve it as CommonJS, independent of the
// package's own "type" field, fixing `attw`'s "masquerading as ESM" finding
// for the "require" condition of a "type": "module" package.
export async function emitCjsTypesForDir(dir) {
  // `dir` is this package's own build output directory, not untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await emitCjsTypesForDir(path)
      continue
    }
    if (!entry.name.endsWith('.d.ts')) continue

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- see above
    let content = await readFile(path, 'utf8')
    if (await cjsHasBareDefaultExport(path)) {
      content = rewriteAsCommonJsDefaultExport(content)
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- see above
    await writeFile(path.replace(/\.d\.ts$/, '.d.cts'), content)
  }
}
