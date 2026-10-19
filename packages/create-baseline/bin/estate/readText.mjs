import { readFile } from 'node:fs/promises'

/** The file at `path` as text, or '' when it cannot be read. */
export async function readText(path) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}
