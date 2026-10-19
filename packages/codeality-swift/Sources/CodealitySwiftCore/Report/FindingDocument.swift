import Foundation

/// The frozen JSON shape of one finding.
func findingDocument(_ finding: Finding) -> [String: Any] {
  [
    "code": finding.code.code,
    "slug": finding.code.slug,
    "message": finding.message,
    "path": finding.location.path,
    "line": finding.location.line,
    "column": finding.location.column,
    "subject": finding.subject ?? NSNull(),
    "baseline_state": finding.baselineState ?? NSNull(),
    "fingerprint": finding.fingerprint,
  ]
}
