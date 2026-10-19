/// Every stage that ran, and the exit code they add up to.
public struct GateResult: Sendable {
  public let stages: [StageResult]

  /// A stage that could not run is 3, never a skip - an optional stage too,
  /// once its tool is installed: only a missing optional tool is skipped.
  /// Any findings are 1; otherwise 0.
  public var exitCode: ExitCode {
    if stages.contains(where: { $0.status == .failedToRun }) {
      return .infrastructure
    }
    if stages.contains(where: { $0.status == .findings }) { return .findings }
    return .ok
  }
}
