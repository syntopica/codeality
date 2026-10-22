export type KnipCompatibilityReport = {
  scope: {
    cwd: string
    configFilePath: string
    includedWorkspaceDirs: string[]
    selectedWorkspaces?: string[]
    strictConfigHints: boolean
  }
  counters: { devDependencies: number; unlisted: number; unresolved: number }
  configurationHints: { type: string; identifier: string }[]
  dependencyIssues: Record<string, Record<string, { symbol: string }>>
  hasConfigLoadErrors: boolean
}
