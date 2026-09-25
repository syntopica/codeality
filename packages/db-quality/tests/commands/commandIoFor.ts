import type { CommandIo } from '@/commands/CommandIo.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

/** A CommandIo that collects what a command prints. */
export const commandIoFor = (
  root: string,
  runner: CommandRunner,
): CommandIo & { out: string[]; err: string[] } => {
  const out: string[] = []
  const err: string[] = []
  return {
    root,
    runner,
    stdout: (text) => {
      out.push(text)
    },
    stderr: (text) => {
      err.push(text)
    },
    out,
    err,
  }
}
