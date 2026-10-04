import type { CommandIo } from '@/commands/CommandIo.js'
import type { TestFile } from '@/model/TestFile.js'
import type { VitestRun } from '@/model/VitestRun.js'

/** A CommandIo over an in-memory file map, recording output and vitest runs. */
export const commandIoFor = (
  files: Record<string, string>,
  inventory: TestFile[],
  runs: VitestRun[],
): CommandIo & { out: string[]; err: string[]; vitestArgs: string[][] } => {
  const out: string[] = []
  const err: string[] = []
  const vitestArgs: string[][] = []
  return {
    root: '/repo',
    out,
    err,
    vitestArgs,
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    readText: (path) => files[path],
    inventory: () => inventory,
    runVitest: async (_root, args) => {
      vitestArgs.push(args)
      const run = runs.shift()
      if (!run) throw new Error('no vitest run stubbed')
      return Promise.resolve(run)
    },
  }
}
