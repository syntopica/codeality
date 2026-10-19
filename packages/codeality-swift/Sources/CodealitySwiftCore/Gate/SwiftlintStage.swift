/// `swiftlint lint --strict`, optional: skipped when swiftlint is not
/// installed. With a `swiftlint` baseline section only new violations fail.
public func swiftlintStage(
  projectRoot: String, config: SwiftConfig, baseline: BaselineFile?,
  environment: [String: String]? = nil
) async -> StageResult {
  let name = "swiftlint"
  let run = runTool(
    "swiftlint",
    ["lint", "--strict", "--quiet", "--reporter", "json"]
      + configFileArguments(projectRoot, "--config", ".swiftlint.yml")
      + existingRoots(projectRoot, config),
    workingDirectory: projectRoot, environment: environment)
  if run.missing {
    return StageResult(
      name: name, kind: .optional, command: run.command, status: .skippedNotApplicable,
      detail: "swiftlint is not installed")
  }
  guard [0, 2].contains(run.exitCode),
    let findings = try? parseSwiftlintReport(run.stdout, projectRoot: projectRoot)
  else { return infrastructureFailure(name, .optional, run) }
  let classified = classifyGateFindings(findings, baseline?.section("swiftlint") ?? [:])
  return StageResult(
    name: name, kind: .optional, command: run.command,
    status: classified.counts.newCount == 0 ? .passed : .findings, exitCode: run.exitCode,
    findings: classified.findings, newCount: classified.counts.newCount,
    knownCount: classified.counts.knownCount, resolvedCount: classified.counts.resolvedCount)
}
