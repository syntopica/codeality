import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function stripSourcemapSources() {
  const files = await readdir('dist', { recursive: true, withFileTypes: true })

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.map')) continue

    const path = join(file.parentPath, file.name)
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path is a file enumerated under dist.
    const map = JSON.parse(await readFile(path, 'utf8'))
    if (!Object.hasOwn(map, 'sourcesContent')) continue

    delete map.sourcesContent
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Rewrite only the generated map read above.
    await writeFile(path, `${JSON.stringify(map)}\n`)
  }
}

await stripSourcemapSources()
