import { readFile } from 'node:fs/promises'

export async function readAuditAllowlist(path) {
  let raw
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid advisory allowlist JSON.')
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Advisory allowlist must be an object.')
  }
  for (const [id, entry] of Object.entries(parsed)) {
    if (!entry?.reason || !entry?.expires) {
      throw new Error(
        `allowlist entry ${id} needs both \`reason\` and \`expires\`.`,
      )
    }
  }
  return parsed
}
