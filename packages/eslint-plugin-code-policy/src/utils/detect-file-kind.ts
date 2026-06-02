import { startsWithCamelPrefix } from '@/utils/starts-with-camel-prefix.js'

// Maps an atomic unit's filename to the semantic kind it represents and the
// folder that kind is expected to live in. Detection is camelCase-boundary
// aware (see startsWithCamelPrefix), so `userCache`/`mapping`/`selected` are
// not mistaken for `use`/`map`/`select` kinds. Returns null when the file is
// not a placement-checked kind.
export function detectFileKind(
  basename: string,
): { kind: string; expectedFolder: string } | null {
  if (startsWithCamelPrefix(basename, 'use')) {
    return { kind: 'hook or composable', expectedFolder: 'hooks' }
  }
  if (
    startsWithCamelPrefix(basename, 'format') ||
    basename.endsWith('Formatter.ts')
  ) {
    return { kind: 'formatter', expectedFolder: 'formatters' }
  }
  if (
    startsWithCamelPrefix(basename, 'validate') ||
    basename.endsWith('Validator.ts')
  ) {
    return { kind: 'validator', expectedFolder: 'validators' }
  }
  if (
    startsWithCamelPrefix(basename, 'map') ||
    basename.endsWith('Mapper.ts') ||
    basename.endsWith('Transformer.ts')
  ) {
    return { kind: 'mapper', expectedFolder: 'mappers' }
  }
  if (
    startsWithCamelPrefix(basename, 'select') ||
    basename.endsWith('Selector.ts')
  ) {
    return { kind: 'selector', expectedFolder: 'selectors' }
  }
  return null
}
