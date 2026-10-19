/// Run every structural rule over the project, fingerprinting each finding.
/// [only] restricts the files; [failFast] stops after the first file with
/// findings.
public func checkProject(
  projectRoot: String, config: SwiftConfig, only: [String] = [], failFast: Bool = false
)
  throws -> CheckResult
{
  var warnings: [String] = []
  let paths = collectSourceFiles(root: projectRoot, config: config) { warnings.append($0) }
    .filter { isWithinAny($0, only) }
  var findings: [Finding] = []
  for path in paths {
    let file = try parseSourceFile(projectRoot: projectRoot, path: path, config: config)
    for finding in try checkSourceFile(file, config) {
      let identity = fingerprint(
        section: "structure", code: finding.code.code, path: path,
        context: fingerprintContext(finding, file.text))
      findings.append(finding.withBaseline(identity, "new"))
    }
    if failFast && !findings.isEmpty { break }
  }
  return CheckResult(
    roots: config.roots + config.testRoots, scannedFiles: paths.count,
    findings: findings.sorted(by: findingOrder), warnings: warnings)
}
