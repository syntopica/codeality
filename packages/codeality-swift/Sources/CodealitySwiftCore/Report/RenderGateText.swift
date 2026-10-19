/// The terminal report: every stage, then the verdict.
public func renderGateText(_ result: GateResult) -> String {
    let verdict: String =
        switch result.exitCode {
        case .ok: "passed"
        case .findings: "findings"
        default: "failed to run"
        }
    return
        (result.stages.flatMap(renderStageText) + [
            "gate: \(verdict) (exit \(result.exitCode.rawValue))"
        ])
        .joined(separator: "\n")
}
