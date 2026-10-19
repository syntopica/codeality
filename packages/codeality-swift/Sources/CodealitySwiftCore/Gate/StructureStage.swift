/// The structural rules, measured against the `structure` baseline section.
public func structureStage(projectRoot: String, config: SwiftConfig, baseline: BaselineFile?) async
  -> StageResult
{
  let check: CheckResult
  do {
    check = try checkProject(projectRoot: projectRoot, config: config)
  } catch {
    return StageResult(
      name: "structure", kind: .required, command: "codeality-swift check", status: .failedToRun,
      detail: "\(error)")
  }
  let findings = check.findings.map {
    GateFinding(
      code: "\($0.code.code) \($0.code.slug)", message: $0.message, location: $0.location,
      fingerprint: $0.fingerprint)
  }
  let classified = classifyGateFindings(findings, baseline?.section("structure") ?? [:])
  return StageResult(
    name: "structure", kind: .required,
    command: baseline == nil ? "codeality-swift check" : "codeality-swift baseline check",
    status: classified.counts.newCount == 0 ? .passed : .findings,
    detail: (["\(check.scannedFiles) files"] + check.warnings.map { "warning: \($0)" }).joined(
      separator: "; "),
    findings: classified.findings, newCount: classified.counts.newCount,
    knownCount: classified.counts.knownCount, resolvedCount: classified.counts.resolvedCount)
}
