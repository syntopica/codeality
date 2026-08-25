import { startsWithCamelPrefix } from '@/utils/starts-with-camel-prefix.js'
import { stripCodeExtension } from '@/utils/strip-code-extension.js'

// Maps an atomic unit's filename to the semantic kind it represents and the
// folder that kind is expected to live in. Detection is camelCase-boundary
// aware (see startsWithCamelPrefix), so `userCache`/`mapping`/`selected` are
// not mistaken for `use`/`map`/`select` kinds. The extension is stripped
// first, so `.tsx`, `.jsx` and the `.mts`/`.cts` variants are read the same
// way as `.ts`. Returns null when the file is not a placement-checked kind.
export function detectFileKind(
  filename: string,
): { kind: string; expectedFolder: string } | null {
  const basename = stripCodeExtension(filename)
  if (startsWithCamelPrefix(basename, 'use')) {
    return { kind: 'hook or composable', expectedFolder: 'hooks' }
  }
  if (
    startsWithCamelPrefix(basename, 'format') ||
    basename.endsWith('Formatter')
  ) {
    return { kind: 'formatter', expectedFolder: 'formatters' }
  }
  if (
    startsWithCamelPrefix(basename, 'validate') ||
    basename.endsWith('Validator')
  ) {
    return { kind: 'validator', expectedFolder: 'validators' }
  }
  if (
    startsWithCamelPrefix(basename, 'map') ||
    basename.endsWith('Mapper') ||
    basename.endsWith('Transformer')
  ) {
    return { kind: 'mapper', expectedFolder: 'mappers' }
  }
  if (
    startsWithCamelPrefix(basename, 'select') ||
    basename.endsWith('Selector')
  ) {
    return { kind: 'selector', expectedFolder: 'selectors' }
  }
  return null
}
