import { isAbsolute, resolve } from 'node:path'

export function rebaseCruisePaths(options) {
  if (options.paths === undefined) return undefined
  // TypeScript preserves the declaring config's origin in this internal field.
  // Never substitute process.cwd() when a compiler omits that metadata.
  const origin = options.baseUrl ?? options.pathsBasePath
  if (typeof origin !== 'string' || !isAbsolute(origin)) {
    throw new Error(
      'Unsupported TypeScript paths origin: an absolute baseUrl or pathsBasePath is required',
    )
  }
  if (
    options.paths === null ||
    typeof options.paths !== 'object' ||
    Array.isArray(options.paths)
  ) {
    throw new Error('TypeScript paths must be an alias map')
  }
  const paths = Object.create(null)
  for (const [alias, targets] of Object.entries(options.paths)) {
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error(
        `TypeScript paths targets must be a nonempty array: ${alias}`,
      )
    }
    paths[alias] = []
    for (const target of targets) {
      if (typeof target !== 'string' || target.length === 0) {
        throw new Error(
          `TypeScript paths target must be a nonempty string: ${alias}`,
        )
      }
      paths[alias].push(resolve(origin, target))
    }
  }
  return options.baseUrl === undefined
    ? { paths }
    : { baseUrl: options.baseUrl, paths }
}
