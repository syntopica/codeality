/** What a command needs from the outside world; tests hand in stubs. */
export type CommandIo = {
  root: string
  stdout: (text: string) => void
  stderr: (text: string) => void
}
