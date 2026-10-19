/// Every stage that ran, and the exit code they add up to.
public struct GateResult: Sendable {
    public let stages: [StageResult]

    /// A required stage that could not run is 3, never a skip; any findings
    /// are 1; otherwise 0.
    public var exitCode: ExitCode {
        if stages.contains(where: { $0.kind == .required && $0.status == .failedToRun }) {
            return .infrastructure
        }
        if stages.contains(where: { $0.status == .findings }) { return .findings }
        return .ok
    }
}
