// tsc emits ESM-flavored ".d.ts" files (the package is "type": "module").
// Node/TypeScript treat any ".d.ts" file as ESM under a "type": "module"
// package regardless of which export condition resolved to it, so consumers
// reaching the package through the "require" condition get types that
// `attw` flags as "masquerading as ESM" (FalseESM). The declaration content
// is otherwise identical for both module systems here (no internal relative
// imports that need a different extension), so most files are fixed by
// duplicating the ".d.ts" as a ".d.cts" sibling.
//
// One further wrinkle, handled inside emitCjsTypesForDir: tsup's CJS output
// for a module whose only export is a default export collapses to a bare
// `module.exports = value` (no `__esModule` interop flag), while tsc's
// declaration always emits `export default value`. `attw` flags that
// mismatch as "FalseExportDefault"; those files get `export = value`
// instead in their ".d.cts" copy.

import { emitCjsTypesForDir } from './emit-cjs-types/emit-cjs-types-for-dir.mjs'

await emitCjsTypesForDir(new URL('../dist', import.meta.url).pathname)
