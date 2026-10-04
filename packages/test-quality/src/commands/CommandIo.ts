import type { TestFile } from '@/model/TestFile.js'
import type { VitestRun } from '@/model/VitestRun.js'

/** What a command needs from the outside world; tests hand in stubs. */
export type CommandIo = {
  root: string
  stdout: (text: string) => void
  stderr: (text: string) => void
  /** The file's text, or undefined when it does not exist. */
  readText: (path: string) => string | undefined
  inventory: (root: string) => TestFile[]
  runVitest: (root: string, args: string[]) => Promise<VitestRun>
}
