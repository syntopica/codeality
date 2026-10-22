import { resolve } from 'node:path'

export function parseCruiseArguments(args, root) {
  const remaining = []
  let cwdOnly = false
  for (const argument of args) {
    if (argument === '--cwd-only') {
      if (cwdOnly) throw new Error('Duplicate --cwd-only option')
      cwdOnly = true
    } else {
      remaining.push(argument)
    }
  }
  const configIndex = remaining.indexOf('--config')
  const configPath = resolve(
    root,
    configIndex === -1
      ? '.dependency-cruiser.cjs'
      : (remaining[configIndex + 1] ?? ''),
  )
  const sources = (
    configIndex === -1
      ? remaining
      : [
          ...remaining.slice(0, configIndex),
          ...remaining.slice(configIndex + 2),
        ]
  ).filter(Boolean)
  return { configPath, sources, cwdOnly }
}
