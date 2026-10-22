import { AUDIT_LEVELS } from './auditLevels.mjs'

export function parseAuditArguments(args) {
  const levelIndex = args.indexOf('--level')
  const fileIndex = args.indexOf('--file')
  const level =
    levelIndex === -1 ? 'moderate' : (args[levelIndex + 1] ?? 'moderate')
  const file =
    fileIndex === -1
      ? '.baseline-advisories.json'
      : (args[fileIndex + 1] ?? '.baseline-advisories.json')
  if (!AUDIT_LEVELS.includes(level)) {
    throw new Error(`--level must be one of ${AUDIT_LEVELS.join(', ')}.`)
  }
  return { level, file }
}
