/** The streams `runCli` wrote to, and the io object that collects them. */
export type CliRun = {
  out: string[]
  err: string[]
  io: {
    root: string
    stdout: (text: string) => void
    stderr: (text: string) => void
  }
}
