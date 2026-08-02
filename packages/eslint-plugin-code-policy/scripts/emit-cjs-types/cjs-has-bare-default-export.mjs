import { readFile } from 'node:fs/promises'

// True when the ".cjs" sibling of a ".d.ts" file assigns `module.exports =`
// directly, with no `__esModule` interop flag. tsup emits that bare shape
// for a module whose only export is a default export.
export async function cjsHasBareDefaultExport(dtsPath) {
  const cjsPath = dtsPath.replace(/\.d\.ts$/, '.cjs')
  let cjsContent
  try {
    // `cjsPath` is derived from a path already discovered by walking this
    // package's own `dist/` build output, not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    cjsContent = await readFile(cjsPath, 'utf8')
  } catch {
    return false
  }
  return (
    /module\.exports\s*=/.test(cjsContent) && !cjsContent.includes('__esModule')
  )
}
