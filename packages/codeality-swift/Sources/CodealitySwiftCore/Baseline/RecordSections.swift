/// [base] with each of [sections] re-recorded from the project as it is now.
public func recordSections(projectRoot: String, base: BaselineFile, sections: [String]) async throws
  -> BaselineFile
{
  var result = base
  if sections.contains("structure") {
    let check = try checkProject(projectRoot: projectRoot, config: try loadConfig(projectRoot: projectRoot))
    result = result.withSection("structure", fingerprintCounts(check.findings.map(\.fingerprint)))
  }
  return result
}
