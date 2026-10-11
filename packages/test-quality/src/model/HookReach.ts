/** The package scripts one git hook reaches, with the manifest's scripts. */
export type HookReach = {
  hook: string
  reached: string[]
  scripts: Record<string, string>
}
