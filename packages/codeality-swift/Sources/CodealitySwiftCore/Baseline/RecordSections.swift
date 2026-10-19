/// [base] with each of [sections] re-recorded from the project as it is
/// now. swiftlint, being optional, keeps its old section when not installed.
public func recordSections(projectRoot: String, base: BaselineFile, sections: [String]) async throws
  -> BaselineFile
{
  let config = try loadConfig(projectRoot: projectRoot)
  var result = base
  if sections.contains("structure") {
    let check = try checkProject(projectRoot: projectRoot, config: config)
    result = result.withSection("structure", fingerprintCounts(check.findings.map(\.fingerprint)))
  }
  for name in ["swiftlint", "duplicates"] where sections.contains(name) {
    let stage =
      name == "swiftlint"
      ? await swiftlintStage(projectRoot: projectRoot, config: config, baseline: nil)
      : await duplicatesStage(projectRoot: projectRoot, config: config, baseline: nil)
    if stage.status == .skippedNotApplicable { continue }
    if stage.status == .failedToRun {
      throw InfrastructureError("\(stage.command): \(stage.detail)")
    }
    result = result.withSection(name, fingerprintCounts(stage.findings.map(\.fingerprint)))
  }
  return result
}
