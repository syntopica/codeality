/// The versioned machine-readable gate document.
public func renderGateJson(_ result: GateResult) -> String {
  renderJson([
    "schema_version": reportSchemaVersion,
    "tool": ["name": "codeality-swift", "version": packageVersion],
    "exit_code": Int(result.exitCode.rawValue),
    "stages": result.stages.map(stageDocument),
  ])
}
