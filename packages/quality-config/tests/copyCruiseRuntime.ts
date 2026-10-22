import { cpSync, mkdirSync, realpathSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'

export function copyCruiseRuntime(root: string): string {
  const installed = join(root, 'node_modules/@syntopica/quality-config')
  mkdirSync(join(installed, 'node_modules'), { recursive: true })
  cpSync(new URL('../bin', import.meta.url), join(installed, 'bin'), {
    recursive: true,
  })
  cpSync(
    new URL('../package.json', import.meta.url),
    join(installed, 'package.json'),
  )
  symlinkSync(
    realpathSync(new URL('../node_modules/typescript', import.meta.url)),
    join(installed, 'node_modules/typescript'),
    'dir',
  )
  return installed
}
