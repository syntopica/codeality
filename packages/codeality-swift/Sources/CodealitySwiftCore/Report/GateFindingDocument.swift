/// The JSON shape of one gate finding.
func gateFindingDocument(_ finding: GateFinding) -> [String: Any] {
  [
    "code": finding.code,
    "message": finding.message,
    "path": finding.location.path,
    "line": finding.location.line,
    "column": finding.location.column,
    "baseline_state": finding.baselineState,
    "fingerprint": finding.fingerprint,
  ]
}
