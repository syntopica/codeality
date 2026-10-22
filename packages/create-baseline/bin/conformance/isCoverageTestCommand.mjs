// Only static runner commands using the discovered root config are proven.
export function isCoverageTestCommand(command, testConfig) {
  if (
    /[;&|$`]|(?:^|\s)(?:--(?:config|root|dir|project|workspace)(?:=|\s|$)|-[cr])/.test(
      command,
    )
  )
    return false
  if (testConfig) {
    const runner = /\b(vitest|jest)\b/.exec(command)?.[1]
    const configRunner = testConfig.name.startsWith('jest.config.')
      ? 'jest'
      : 'vitest'
    if (runner !== configRunner) return false
  }
  return /^\s*(?:(?:pnpm|npm|yarn|bun)\s+(?:exec\s+|dlx\s+|x\s+))?(?:vitest|jest)(?:\s|$)/.test(
    command,
  )
}
