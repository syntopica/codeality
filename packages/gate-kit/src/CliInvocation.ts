/** What the argument vector asks a gate CLI to do. */
export type CliInvocation =
  | { kind: 'version' }
  | { kind: 'help' }
  | {
      kind: 'command'
      root: string
      command: string | undefined
      rest: string[]
    }
