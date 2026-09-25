import type { CommandRunner } from '@/tools/CommandRunner.js'

/** What a command needs from the outside world; tests hand in stubs. */
export type CommandIo = {
  root: string
  runner: CommandRunner
  stdout: (text: string) => void
  stderr: (text: string) => void
}
