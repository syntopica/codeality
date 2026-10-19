import Foundation

/// The JSON shape of one stage.
func stageDocument(_ stage: StageResult) -> [String: Any] {
    [
        "name": stage.name,
        "kind": stage.kind.rawValue,
        "command": stage.command,
        "duration_ms": Int(stage.seconds * 1000),
        "status": stage.status.rawValue,
        "exit_code": stage.exitCode.map { Int($0) as Any } ?? NSNull(),
        "detail": stage.detail,
        "new": stage.newCount,
        "known": stage.knownCount,
        "resolved": stage.resolvedCount,
        "findings": stage.findings.map(gateFindingDocument),
    ]
}
