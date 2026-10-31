import type { CliRun } from './CliRun.js'

/** An io for `runCli` rooted at `root` that keeps what it prints. */
export const captureCli = (root: string): CliRun => {
  const out: string[] = []
  const err: string[] = []
  return {
    out,
    err,
    io: {
      root,
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
    },
  }
}
