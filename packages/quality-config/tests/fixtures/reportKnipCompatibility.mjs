export default function reportKnipCompatibility(result) {
  process.stdout.write(
    JSON.stringify({
      scope: {
        cwd: result.cwd,
        configFilePath: result.configFilePath,
        includedWorkspaceDirs: result.includedWorkspaceDirs,
        selectedWorkspaces: result.selectedWorkspaces,
        strictConfigHints: result.isTreatConfigHintsAsErrors,
      },
      counters: result.counters,
      configurationHints: result.configurationHints,
      dependencyIssues: result.issues.devDependencies,
      hasConfigLoadErrors: Boolean(result.hasConfigLoadErrors),
    }) + '\n',
  )
}
