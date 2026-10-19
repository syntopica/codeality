/// One line per finding, the warnings, then a summary of what was scanned.
public func renderTextReport(_ result: CheckResult) -> String {
  (result.findings.map(renderFindingLine) + result.warnings.map { "warning: \($0)" }
    + [
      "\(result.findings.count) findings in \(result.scannedFiles) files under "
        + result.roots.joined(separator: ", ")
    ]).joined(separator: "\n")
}
