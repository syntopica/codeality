/// The versioned machine-readable document. Only this goes to stdout.
public func renderJsonReport(_ result: CheckResult) -> String {
  renderJson([
    "schema_version": reportSchemaVersion,
    "tool": ["name": "codeality-swift", "version": packageVersion],
    "roots": result.roots,
    "scanned_files": result.scannedFiles,
    "findings": result.findings.map(findingDocument),
    "warnings": result.warnings,
    "summary": findingsSummary(result.findings),
  ])
}
