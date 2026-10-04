import { ConfigError } from '@syntopica/gate-kit/ConfigError'

import type { TestFile } from '@/model/TestFile.js'

/** Reads the probe's output: the last line of stdout is the JSON array. */
export const parseInventory = (stdout: string): TestFile[] => {
  const line = stdout.trim().split('\n').at(-1) ?? ''
  if (!line.startsWith('[')) {
    throw new ConfigError('vitest did not list the suite: is vitest installed?')
  }
  return JSON.parse(line) as TestFile[]
}
